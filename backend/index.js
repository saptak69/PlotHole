import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, queryOne, execute, initDb, getDbStatus } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_letterboxd_key';
const TMDB_API_KEY = process.env.TMDB_API_KEY || ''; // Can be Read Access Token or API Key

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = '***';
    console.log('  Body:', safeBody);
  }
  next();
});

// Initialize Database
initDb().catch(err => {
  console.error('Failed to initialize database:', err);
});

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Simple in-memory cache for TMDB API calls to speed up responses and prevent rate-limiting
const tmdbCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes for listings/search
const DETAIL_CACHE_TTL = 60 * 60 * 1000; // 1 hour for details, credits, recommendations

function getCachedData(key) {
  const cached = tmdbCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > cached.ttl) {
    tmdbCache.delete(key);
    return null;
  }
  return cached.data;
}

function setCachedData(key, data, ttl) {
  tmdbCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

// Periodic garbage collection for expired cache entries
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of tmdbCache.entries()) {
    if (now - value.timestamp > value.ttl) {
      tmdbCache.delete(key);
    }
  }
}, 15 * 60 * 1000);

class TMDBError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// TMDB Fetch Helper with Caching
async function fetchFromTMDB(endpoint, queryParams = {}) {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB API Key is missing. Live movie data cannot be retrieved.');
  }

  // Build TMDB Request
  const baseUrl = 'https://api.themoviedb.org/3';
  const url = new URL(`${baseUrl}${endpoint}`);
  
  // Append API key and query parameters
  url.searchParams.append('api_key', TMDB_API_KEY);
  Object.keys(queryParams).forEach(key => {
    if (queryParams[key] !== undefined && queryParams[key] !== null) {
      url.searchParams.append(key, queryParams[key]);
    }
  });

  const cacheKey = url.toString();
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    console.log(`[CACHE HIT] ${endpoint}`);
    return cachedData;
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    const errText = await response.text();
    throw new TMDBError(response.status, `TMDB API error: ${response.status} - ${errText}`);
  }
  
  const data = await response.json();
  
  // Choose TTL based on API path
  const isDetail = endpoint.includes('/movie/') || endpoint.includes('/tv/') || endpoint.includes('/media/');
  const ttl = isDetail ? DETAIL_CACHE_TTL : CACHE_TTL;
  setCachedData(cacheKey, data, ttl);

  return data;
}

// --- AUTH ROUTES ---

// Signup
app.post('/api/auth/signup', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if user exists
    const existingUser = await queryOne(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase(), username.toLowerCase()]
    );
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = 'usr_' + Math.random().toString(36).substr(2, 9);
    const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`;

    await execute(
      'INSERT INTO users (id, username, email, password_hash, avatar_url, bio) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, username, email.toLowerCase(), passwordHash, avatarUrl, 'Movie enthusiast.']
    );

    const token = jwt.sign({ id: userId, username, email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: userId, username, email, avatar_url: avatarUrl, bio: 'Movie enthusiast.' }
    });
  } catch (error) {
    console.error('Signup error:', error);
    if (error.code === 'ENOTFOUND' || error.message.includes('getaddrinfo')) {
      return res.status(503).json({ error: 'Database service is offline or unreachable. Please check your internet connection or DATABASE_URL settings.' });
    }
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await queryOne(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase(), email.toLowerCase()]
    );
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error.code === 'ENOTFOUND' || error.message.includes('getaddrinfo')) {
      return res.status(503).json({ error: 'Database service is offline or unreachable. Please check your internet connection or DATABASE_URL settings.' });
    }
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Get current user profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await queryOne(
      'SELECT id, username, email, avatar_url, bio, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  const { bio, avatar_url } = req.body;
  try {
    await execute(
      'UPDATE users SET bio = $1, avatar_url = $2 WHERE id = $3',
      [bio, avatar_url, req.user.id]
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- TMDB MOVIE PROXY ROUTES ---

app.get('/api/movies/popular', async (req, res) => {
  try {
    const data = await fetchFromTMDB('/movie/popular', { page: req.query.page });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/movies/top-rated', async (req, res) => {
  try {
    const data = await fetchFromTMDB('/movie/top_rated', { page: req.query.page });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/movies/upcoming', async (req, res) => {
  try {
    const data = await fetchFromTMDB('/movie/upcoming', { page: req.query.page });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TV / Web Series popular list
app.get('/api/tv/popular', async (req, res) => {
  try {
    const data = await fetchFromTMDB('/tv/popular', { page: req.query.page });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TV / Web Series top-rated list
app.get('/api/tv/top-rated', async (req, res) => {
  try {
    const data = await fetchFromTMDB('/tv/top_rated', { page: req.query.page });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Multi Search (searches both movies and tv shows)
app.get('/api/movies/search', async (req, res) => {
  try {
    const data = await fetchFromTMDB('/search/multi', { query: req.query.query, page: req.query.page });
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Generic Media Details Route (supports both movie and tv)
app.get('/api/media/:mediaType/:id', async (req, res) => {
  const { mediaType, id } = req.params;
  try {
    const data = await fetchFromTMDB(`/${mediaType}/${id}`);
    res.json({ ...data, media_type: mediaType });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.get('/api/media/:mediaType/:id/credits', async (req, res) => {
  const { mediaType, id } = req.params;
  try {
    const data = await fetchFromTMDB(`/${mediaType}/${id}/credits`);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.get('/api/media/:mediaType/:id/recommendations', async (req, res) => {
  const { mediaType, id } = req.params;
  try {
    const data = await fetchFromTMDB(`/${mediaType}/${id}/recommendations`);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Fallback movie details (compatibility and auto-detection fallback)
app.get('/api/movies/:id', async (req, res) => {
  try {
    const data = await fetchFromTMDB(`/movie/${req.params.id}`);
    res.json({ ...data, media_type: 'movie' });
  } catch (error) {
    if (error.status === 404) {
      try {
        const tvData = await fetchFromTMDB(`/tv/${req.params.id}`);
        return res.json({ ...tvData, media_type: 'tv' });
      } catch (tvErr) {
        // Ignore tv error and throw original movie error
      }
    }
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.get('/api/movies/:id/credits', async (req, res) => {
  try {
    const data = await fetchFromTMDB(`/movie/${req.params.id}/credits`);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.get('/api/movies/:id/recommendations', async (req, res) => {
  try {
    const data = await fetchFromTMDB(`/movie/${req.params.id}/recommendations`);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// --- REVIEW ROUTES ---

// Create or update review
app.post('/api/reviews', authenticateToken, async (req, res) => {
  const { tmdb_movie_id, rating, review_text } = req.body;

  if (!tmdb_movie_id || rating === undefined) {
    return res.status(400).json({ error: 'Movie ID and rating are required' });
  }

  try {
    // Check if review already exists
    const existing = await queryOne(
      'SELECT id FROM reviews WHERE user_id = $1 AND tmdb_movie_id = $2',
      [req.user.id, tmdb_movie_id]
    );

    if (existing) {
      await execute(
        'UPDATE reviews SET rating = $1, review_text = $2, created_at = CURRENT_TIMESTAMP WHERE id = $3',
        [rating, review_text, existing.id]
      );
      res.json({ message: 'Review updated successfully', id: existing.id });
    } else {
      const reviewId = 'rev_' + Math.random().toString(36).substr(2, 9);
      await execute(
        'INSERT INTO reviews (id, user_id, tmdb_movie_id, rating, review_text) VALUES ($1, $2, $3, $4, $5)',
        [reviewId, req.user.id, tmdb_movie_id, rating, review_text]
      );
      res.status(201).json({ message: 'Review created successfully', id: reviewId });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reviews for a movie
app.get('/api/reviews/movie/:movieId', async (req, res) => {
  try {
    const reviews = await query(
      `SELECT r.*, u.username, u.avatar_url 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.tmdb_movie_id = $1 
       ORDER BY r.created_at DESC`,
      [req.params.movieId]
    );
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get rating distribution for a movie
app.get('/api/reviews/movie/:movieId/distribution', async (req, res) => {
  try {
    const ratings = await query(
      'SELECT rating, COUNT(*) as count FROM reviews WHERE tmdb_movie_id = $1 GROUP BY rating',
      [req.params.movieId]
    );

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;

    ratings.forEach(r => {
      const val = Math.round(r.rating);
      if (distribution[val] !== undefined) {
        distribution[val] += parseInt(r.count);
        total += parseInt(r.count);
      }
    });

    const percentages = {};
    Object.keys(distribution).forEach(key => {
      percentages[key] = total > 0 ? Math.round((distribution[key] / total) * 100) : 0;
    });

    res.json({ total, distribution, percentages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all reviews
app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await query(
      `SELECT r.*, u.username, u.avatar_url 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       ORDER BY r.created_at DESC 
       LIMIT 50`
    );
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete review
app.delete('/api/reviews/:id', authenticateToken, async (req, res) => {
  try {
    const review = await queryOne('SELECT user_id FROM reviews WHERE id = $1', [req.params.id]);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (review.user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized to delete this review' });

    await execute('DELETE FROM reviews WHERE id = $1', [req.params.id]);
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- WATCHLIST ROUTES ---

// Toggle Watchlist
app.post('/api/watchlist/toggle', authenticateToken, async (req, res) => {
  const { tmdb_movie_id } = req.body;
  if (!tmdb_movie_id) return res.status(400).json({ error: 'Movie ID required' });

  try {
    const existing = await queryOne(
      'SELECT 1 FROM watchlist WHERE user_id = $1 AND tmdb_movie_id = $2',
      [req.user.id, tmdb_movie_id]
    );

    if (existing) {
      await execute('DELETE FROM watchlist WHERE user_id = $1 AND tmdb_movie_id = $2', [req.user.id, tmdb_movie_id]);
      res.json({ onWatchlist: false });
    } else {
      await execute('INSERT INTO watchlist (user_id, tmdb_movie_id) VALUES ($1, $2)', [req.user.id, tmdb_movie_id]);
      res.json({ onWatchlist: true });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's watchlist state for a movie
app.get('/api/watchlist/check/:movieId', authenticateToken, async (req, res) => {
  try {
    const existing = await queryOne(
      'SELECT 1 FROM watchlist WHERE user_id = $1 AND tmdb_movie_id = $2',
      [req.user.id, req.params.movieId]
    );
    res.json({ onWatchlist: !!existing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's watchlist
app.get('/api/watchlist', authenticateToken, async (req, res) => {
  try {
    const items = await query('SELECT tmdb_movie_id, created_at FROM watchlist WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- DIARY ROUTES ---

// Log watched movie
app.post('/api/diary', authenticateToken, async (req, res) => {
  const { tmdb_movie_id, rating, watched_date, review_text } = req.body;

  if (!tmdb_movie_id || !watched_date) {
    return res.status(400).json({ error: 'Movie ID and watched date are required' });
  }

  try {
    const diaryId = 'dry_' + Math.random().toString(36).substr(2, 9);
    await execute(
      'INSERT INTO diary (id, user_id, tmdb_movie_id, rating, watched_date, review_text) VALUES ($1, $2, $3, $4, $5, $6)',
      [diaryId, req.user.id, tmdb_movie_id, rating, watched_date, review_text]
    );

    // If review_text is provided, we also create/update a review automatically
    if (review_text) {
      const existingReview = await queryOne(
        'SELECT id FROM reviews WHERE user_id = $1 AND tmdb_movie_id = $2',
        [req.user.id, tmdb_movie_id]
      );
      if (existingReview) {
        await execute(
          'UPDATE reviews SET rating = $1, review_text = $2, created_at = CURRENT_TIMESTAMP WHERE id = $3',
          [rating, review_text, existingReview.id]
        );
      } else {
        const reviewId = 'rev_' + Math.random().toString(36).substr(2, 9);
        await execute(
          'INSERT INTO reviews (id, user_id, tmdb_movie_id, rating, review_text) VALUES ($1, $2, $3, $4, $5)',
          [reviewId, req.user.id, tmdb_movie_id, rating, review_text]
        );
      }
    }

    res.status(201).json({ message: 'Diary entry created', id: diaryId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's diary
app.get('/api/diary/user/:userId', async (req, res) => {
  try {
    const diary = await query(
      'SELECT * FROM diary WHERE user_id = $1 ORDER BY watched_date DESC, created_at DESC',
      [req.params.userId]
    );
    res.json(diary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if movie is watched
app.get('/api/diary/check/:movieId', authenticateToken, async (req, res) => {
  try {
    const existing = await queryOne(
      'SELECT 1 FROM diary WHERE user_id = $1 AND tmdb_movie_id = $2 LIMIT 1',
      [req.user.id, req.params.movieId]
    );
    res.json({ watched: !!existing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle watched status
app.post('/api/diary/toggle-watched', authenticateToken, async (req, res) => {
  const { tmdb_movie_id } = req.body;
  if (!tmdb_movie_id) return res.status(400).json({ error: 'Movie ID required' });

  try {
    const existing = await queryOne(
      'SELECT id FROM diary WHERE user_id = $1 AND tmdb_movie_id = $2 LIMIT 1',
      [req.user.id, tmdb_movie_id]
    );

    if (existing) {
      // Unwatch: Delete diary entries
      await execute('DELETE FROM diary WHERE user_id = $1 AND tmdb_movie_id = $2', [req.user.id, tmdb_movie_id]);
      res.json({ watched: false });
    } else {
      // Quick watch: Add a log entry for today
      const diaryId = 'dry_' + Math.random().toString(36).substr(2, 9);
      const todayStr = new Date().toISOString().split('T')[0];
      await execute(
        'INSERT INTO diary (id, user_id, tmdb_movie_id, rating, watched_date, review_text) VALUES ($1, $2, $3, $4, $5, $6)',
        [diaryId, req.user.id, tmdb_movie_id, null, todayStr, null]
      );
      res.json({ watched: true });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get excited stats for an upcoming movie
app.get('/api/movies/:id/excited', async (req, res) => {
  const movieId = req.params.id;
  const authHeader = req.headers['authorization'];
  let currentUserId = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      currentUserId = decoded.id;
    } catch (err) {
      // Ignore invalid token
    }
  }

  try {
    const countResult = await queryOne('SELECT COUNT(*) as count FROM diary WHERE tmdb_movie_id = $1', [movieId]);
    const totalCount = countResult?.count || 0;

    let userExcited = false;
    if (currentUserId) {
      const userCheck = await queryOne('SELECT 1 FROM diary WHERE user_id = $1 AND tmdb_movie_id = $2', [currentUserId, movieId]);
      userExcited = !!userCheck;
    }

    res.json({ count: totalCount, excited: userExcited });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- SOCIAL / PROFILE ROUTES ---

// Get user profile details
app.get('/api/users/profile/:username', async (req, res) => {
  const { username } = req.params;
  const currentUserId = req.query.currentUserId || null;

  try {
    const user = await queryOne('SELECT id, username, avatar_url, bio, created_at FROM users WHERE username = $1', [username.toLowerCase()]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Fetch stats
    const reviewsCount = await queryOne('SELECT COUNT(*) as count FROM reviews WHERE user_id = $1', [user.id]);
    const diaryCount = await queryOne('SELECT COUNT(*) as count FROM diary WHERE user_id = $1', [user.id]);
    const watchlistCount = await queryOne('SELECT COUNT(*) as count FROM watchlist WHERE user_id = $1', [user.id]);
    
    const followersCount = await queryOne('SELECT COUNT(*) as count FROM follows WHERE following_id = $1', [user.id]);
    const followingCount = await queryOne('SELECT COUNT(*) as count FROM follows WHERE follower_id = $1', [user.id]);

    let isFollowing = false;
    if (currentUserId) {
      const followCheck = await queryOne('SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2', [currentUserId, user.id]);
      isFollowing = !!followCheck;
    }

    res.json({
      user,
      stats: {
        reviews: reviewsCount.count || 0,
        diary: diaryCount.count || 0,
        watchlist: watchlistCount.count || 0,
        followers: followersCount.count || 0,
        following: followingCount.count || 0
      },
      isFollowing
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Follow User
app.post('/api/social/follow/:userId', authenticateToken, async (req, res) => {
  const targetUserId = req.params.userId;
  if (targetUserId === req.user.id) return res.status(400).json({ error: "You can't follow yourself" });

  try {
    await execute(
      'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', // ON CONFLICT works in PostgreSQL. In SQLite, we handle it
      [req.user.id, targetUserId]
    ).catch(async (err) => {
      // Fallback for SQLite which doesn't support ON CONFLICT DO NOTHING in this syntax
      try {
        await execute('INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)', [req.user.id, targetUserId]);
      } catch (sqErr) {
        // Ignore duplicate key error
      }
    });

    res.json({ following: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unfollow User
app.post('/api/social/unfollow/:userId', authenticateToken, async (req, res) => {
  const targetUserId = req.params.userId;
  try {
    await execute(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
      [req.user.id, targetUserId]
    );
    res.json({ following: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Social Feed (Activities of people you follow)
app.get('/api/social/feed', authenticateToken, async (req, res) => {
  try {
    const feed = await query(
      `SELECT 'review' as type, r.id as activity_id, r.created_at, r.rating, r.review_text, r.tmdb_movie_id, u.username, u.avatar_url, u.id as user_id
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.user_id IN (SELECT following_id FROM follows WHERE follower_id = $1)
       
       UNION ALL
       
       SELECT 'watch' as type, d.id as activity_id, d.created_at, d.rating, d.review_text, d.tmdb_movie_id, u.username, u.avatar_url, u.id as user_id
       FROM diary d
       JOIN users u ON d.user_id = u.id
       WHERE d.user_id IN (SELECT following_id FROM follows WHERE follower_id = $1)
       
       ORDER BY created_at DESC
       LIMIT 30`,
      [req.user.id]
    );
    res.json(feed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get User Ratings Distribution (for stats visualizers)
app.get('/api/users/profile/:username/ratings-dist', async (req, res) => {
  try {
    const user = await queryOne('SELECT id FROM users WHERE username = $1', [req.params.username.toLowerCase()]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const dist = await query(
      `SELECT rating, COUNT(*) as count 
       FROM reviews 
       WHERE user_id = $1 
       GROUP BY rating 
       ORDER BY rating ASC`,
      [user.id]
    );
    res.json(dist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint to verify Supabase connection status
app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');
    const status = getDbStatus();
    res.json({
      status: 'OK',
      database: status.usingFallback ? 'FALLBACK' : 'CONNECTED',
      type: status.isPostgres ? 'postgresql' : 'sqlite',
      usingFallback: status.usingFallback
    });
  } catch (err) {
    res.status(503).json({
      status: 'ERROR',
      database: 'DISCONNECTED',
      error: err.message,
      code: err.code
    });
  }
});

// Serve frontend built static assets in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(distPath));
  
  // Wildcard client side router fallback (version-agnostic middleware approach)
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.method !== 'GET') {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('[UNHANDLED EXCEPTION]:', err);
  if (err.code === 'ENOTFOUND' || err.message.includes('getaddrinfo')) {
    return res.status(503).json({ error: 'Database service is offline or unreachable. Please check your internet connection or DATABASE_URL settings.' });
  }
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
