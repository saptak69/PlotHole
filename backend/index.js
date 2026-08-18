import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'node:zlib';
import { v2 as cloudinary } from 'cloudinary';
import { query, queryOne, execute, initDb, getDbStatus, withTransaction } from './db.js';

dotenv.config();

if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_letterboxd_key';
const TMDB_API_KEY = process.env.TMDB_API_KEY || ''; // Can be Read Access Token or API Key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// High-Performance Native Gzip Response Compression Middleware
app.use((req, res, next) => {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  if (!acceptEncoding.includes('gzip')) {
    return next();
  }

  const originalSend = res.send;
  res.send = function (body) {
    if (!body || req.method === 'HEAD') {
      return originalSend.call(this, body);
    }

    try {
      let buffer;
      if (Buffer.isBuffer(body)) {
        buffer = body;
      } else if (typeof body === 'object') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        buffer = Buffer.from(JSON.stringify(body));
      } else if (typeof body === 'string') {
        buffer = Buffer.from(body);
      }

      if (buffer && buffer.length > 1024) {
        const compressed = zlib.gzipSync(buffer, { level: 6 });
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Vary', 'Accept-Encoding');
        res.removeHeader('Content-Length');
        return originalSend.call(this, compressed);
      }
    } catch (e) {
      // Fallback to uncompressed on error
    }
    return originalSend.call(this, body);
  };
  next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Fast, non-blocking request logger middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// Initialize Database is handled at the bottom before app.listen to prevent startup 500 errors

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Simple in-memory cache for TMDB API calls to speed up responses and prevent rate-limiting
const tmdbCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes for listings/search
const RECOMMENDATION_CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours
const DETAIL_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours for details, credits, recommendations

function getCloudinaryPublicId(url) {
  if (!url || !url.includes('res.cloudinary.com')) return null;
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    const pathAndId = parts[1];
    const segments = pathAndId.split('/');
    if (segments[0].startsWith('v')) {
      segments.shift();
    }
    const fullId = segments.join('/');
    const dotIdx = fullId.lastIndexOf('.');
    return dotIdx !== -1 ? fullId.substring(0, dotIdx) : fullId;
  } catch (err) {
    console.error('Error parsing Cloudinary public ID:', err);
    return null;
  }
}

async function uploadAvatar(avatarDataUrl, oldAvatarUrl, username) {
  if (!avatarDataUrl) return null;
  if (!avatarDataUrl.startsWith('data:image/')) {
    return avatarDataUrl;
  }

  if (process.env.CLOUDINARY_CLOUD_NAME) {
    const oldPublicId = getCloudinaryPublicId(oldAvatarUrl);
    if (oldPublicId) {
      await cloudinary.uploader.destroy(oldPublicId).catch(err => {
        console.error('Failed to delete old avatar from Cloudinary:', err);
      });
    }

    const uploadRes = await cloudinary.uploader.upload(avatarDataUrl, {
      folder: 'plothole_avatars',
      transformation: [
        { width: 200, height: 200, crop: 'thumb', gravity: 'face' }
      ]
    });
    return uploadRes.secure_url;
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cloudinary is not configured. Avatar uploads are disabled in production.');
    }
    console.warn('WARNING: Cloudinary not configured in development. Using Dicebear fallback avatar.');
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}`;
  }
}

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

// Local mock movie database for offline fallback
const OFFLINE_MOVIES = [
  {
    id: 84958,
    title: "Loki",
    name: "Loki",
    overview: "The mercurial villain Loki resumes his role as the God of Mischief in a new series that takes place after the events of “Avengers: Endgame”.",
    poster_path: "/voHU16Vm61whwZ6Y2AIgl7ic1k0.jpg",
    backdrop_path: "/o76Z2p1u1eh51ONTz44445YvOfq.jpg",
    release_date: "2021-06-09",
    first_air_date: "2021-06-09",
    vote_average: 8.2,
    genre_ids: [18, 10765],
    genres: [{ id: 18, name: "Drama" }, { id: 10765, name: "Sci-Fi & Fantasy" }],
    media_type: "tv"
  },
  {
    id: 1339713,
    title: "Interstellar",
    overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
    poster_path: "/gEU2QniE6E7vNIvN2mOYDc3eJ5R.jpg",
    backdrop_path: "/xJH1z7icuA68ERtBi63R6Ah41nd.jpg",
    release_date: "2014-11-05",
    vote_average: 8.4,
    genre_ids: [12, 18, 878],
    genres: [{ id: 12, name: "Adventure" }, { id: 18, name: "Drama" }, { id: 878, name: "Science Fiction" }],
    media_type: "movie"
  },
  {
    id: 1275779,
    title: "Pulp Fiction",
    overview: "A burger-loving hitman, his philosophical partner, a drug-addled gangster's moll, and a washed-up boxer converge in this sprawling, comedic crime caper. Their adventures unfurl in three stories that ingeniously trip back and forth in time.",
    poster_path: "/d5iIlvfj0tIQlhJ78Veeu0z7PP7.jpg",
    backdrop_path: "/sua6j1N1FC1Z47v63jISZzZ6Eg5.jpg",
    release_date: "1994-09-10",
    vote_average: 8.5,
    genre_ids: [53, 80],
    genres: [{ id: 53, name: "Thriller" }, { id: 80, name: "Crime" }],
    media_type: "movie"
  },
  {
    id: 1081003,
    title: "The Godfather",
    overview: "Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family. When organized crime family patriarch, Vito Corleone, survives a murder attempt, his youngest son, Michael, steps in to take control.",
    poster_path: "/3bhkrj6PjOqZEjj9949wY2m64wP.jpg",
    backdrop_path: "/tmU7GeKVZ2uOgeARZ2JlxJd74J5.jpg",
    release_date: "1972-03-14",
    vote_average: 8.7,
    genre_ids: [18, 80],
    genres: [{ id: 18, name: "Drama" }, { id: 80, name: "Crime" }],
    media_type: "movie"
  },
  {
    id: 969681,
    title: "Inception",
    overview: "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets, is offered a chance to regain his old life as payment for a task considered to be impossible: \"inception\", the implantation of another person's idea into a target's subconscious.",
    poster_path: "/o0q46t3aIM7rGjxlEP2w4w0GYFZ.jpg",
    backdrop_path: "/8ZMRsiK8vf96ecNd7SvH92hJxyY.jpg",
    release_date: "2010-07-15",
    vote_average: 8.3,
    genre_ids: [28, 878, 12],
    genres: [{ id: 28, name: "Action" }, { id: 878, name: "Science Fiction" }, { id: 12, name: "Adventure" }],
    media_type: "movie"
  }
];

function getOfflineFallback(endpoint) {
  if (endpoint.includes('/videos')) {
    return {
      results: [
        { id: 'off_trailer_1', key: 'L3oOldV-fOG', name: 'Official Trailer', site: 'YouTube', type: 'Trailer' }
      ]
    };
  }

  if (endpoint.includes('/genre/movie/list') || endpoint.includes('/genre/tv/list')) {
    return {
      genres: [
        { id: 28, name: "Action" },
        { id: 12, name: "Adventure" },
        { id: 16, name: "Animation" },
        { id: 35, name: "Comedy" },
        { id: 80, name: "Crime" },
        { id: 99, name: "Documentary" },
        { id: 18, name: "Drama" },
        { id: 10751, name: "Family" },
        { id: 14, name: "Fantasy" },
        { id: 36, name: "History" },
        { id: 27, name: "Horror" },
        { id: 10402, name: "Music" },
        { id: 9648, name: "Mystery" },
        { id: 10749, name: "Romance" },
        { id: 878, name: "Science Fiction" },
        { id: 53, name: "Thriller" },
        { id: 10752, name: "War" },
        { id: 37, name: "Western" }
      ]
    };
  }

  // If request is for a specific movie details (e.g. /movie/1339713 or /tv/84958)
  const movieDetailMatch = endpoint.match(/\/(movie|tv|media)\/(\d+)/);
  if (movieDetailMatch) {
    const type = movieDetailMatch[1];
    const id = parseInt(movieDetailMatch[2]);
    const mockMovie = OFFLINE_MOVIES.find(m => m.id === id);
    const baseData = mockMovie || {
      id: id,
      title: 'Archive Film',
      name: 'Archive Show',
      overview: "Details for this chronicle are currently archived offline. Please check your internet connection to fetch live data from TMDB.",
      poster_path: null,
      backdrop_path: null,
      release_date: "1999-01-01",
      vote_average: 7.0,
      genres: [{ id: 18, name: "Drama" }],
      media_type: type === 'tv' ? 'tv' : 'movie'
    };

    return {
      ...baseData,
      media_type: type === 'media' ? (mockMovie?.media_type || 'movie') : type,
      credits: {
        cast: [
          { id: 1, name: "Lead Actor", character: "Protagonist", profile_path: null },
          { id: 2, name: "Supporting Cast", character: "Companion", profile_path: null }
        ],
        crew: [{ id: 3, name: "Renowned Director", job: "Director", department: "Directing" }]
      },
      recommendations: { results: OFFLINE_MOVIES.slice(0, 4) },
      videos: {
        results: [{ id: 'off_trailer_1', key: 'L3oOldV-fOG', name: 'Official Trailer', site: 'YouTube', type: 'Trailer' }]
      },
      'watch/providers': { results: {} }
    };
  }

  // If request is for credits
  if (endpoint.includes('/credits')) {
    return { cast: [{ name: "Director / Cast offline", character: "Self", profile_path: null }], crew: [] };
  }

  // If request is for recommendations
  if (endpoint.includes('/recommendations')) {
    return { results: OFFLINE_MOVIES.slice(0, 3) };
  }

  // If request is for lists (popular, top-rated, upcoming, search)
  if (
    endpoint.includes('/popular') || 
    endpoint.includes('/top_rated') || 
    endpoint.includes('/upcoming') || 
    endpoint.includes('/search')
  ) {
    const isTv = endpoint.includes('/tv/');
    const filtered = OFFLINE_MOVIES.filter(m => isTv ? m.media_type === 'tv' : m.media_type === 'movie');
    return {
      results: filtered.length > 0 ? filtered : OFFLINE_MOVIES,
      page: 1,
      total_pages: 1,
      total_results: OFFLINE_MOVIES.length
    };
  }

  return null;
}

// TMDB Fetch Helper with Caching and offline resilience
async function fetchFromTMDB(endpoint, queryParams = {}) {
  // Build TMDB Request
  const baseUrl = 'https://api.themoviedb.org/3';
  const url = new URL(`${baseUrl}${endpoint}`);
  
  if (TMDB_API_KEY) {
    url.searchParams.append('api_key', TMDB_API_KEY);
  }
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

  if (!TMDB_API_KEY) {
    const fallback = getOfflineFallback(endpoint);
    if (fallback !== null) return fallback;
    throw new Error('TMDB API Key is missing and no offline fallback available.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout

  let response;
  try {
    response = await fetch(url.toString(), { signal: controller.signal });
  } catch (err) {
    clearTimeout(timeoutId);
    console.error(`TMDB Request failed for ${endpoint}:`, err.message);
    
    // OFFLINE FALLBACK ON CONNECTION ERROR / TIMEOUT
    const fallback = getOfflineFallback(endpoint);
    if (fallback !== null) {
      console.log(`[OFFLINE FALLBACK SUCCESS] serving mock data for ${endpoint}`);
      return fallback;
    }
    throw err;
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    const errText = await response.text();
    console.error(`TMDB API returned error status ${response.status} for ${endpoint}:`, errText);
    
    // OFFLINE FALLBACK ON API FAILURE (e.g. 401/404/etc.)
    const fallback = getOfflineFallback(endpoint);
    if (fallback !== null) {
      console.log(`[OFFLINE FALLBACK SUCCESS] serving mock data for ${endpoint}`);
      return fallback;
    }
    throw new TMDBError(response.status, `TMDB API error: ${response.status} - ${errText}`);
  }
  
  const data = await response.json();
  
  // Choose TTL based on API path
  let ttl = CACHE_TTL;
  if (endpoint.includes('/recommendations')) {
    ttl = RECOMMENDATION_CACHE_TTL;
  } else if (
    endpoint.includes('/credits') ||
    endpoint.match(/\/(movie|tv|media)\/\d+$/)
  ) {
    ttl = DETAIL_CACHE_TTL;
  }
  setCachedData(cacheKey, data, ttl);
  return data;
}

// --- AUTH ROUTES -
// Signup
app.post('/api/auth/signup', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const normalizedUsername = username.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();

  try {
    // Check if user exists using normalized values
    const existingUser = await queryOne(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [normalizedEmail, normalizedUsername]
    );
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = 'usr_' + Math.random().toString(36).substr(2, 9);
    const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(normalizedUsername)}`;

    await execute(
      'INSERT INTO users (id, username, email, password_hash, avatar_url, bio, display_name) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, normalizedUsername, normalizedEmail, passwordHash, avatarUrl, 'Movie enthusiast.', username.trim()]
    );

    const token = jwt.sign({ id: userId, username: normalizedUsername, email: normalizedEmail }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: userId, username: normalizedUsername, email: normalizedEmail, avatar_url: avatarUrl, bio: 'Movie enthusiast.', display_name: username.trim() }
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

  const normalizedInput = email.trim().toLowerCase();

  try {
    const user = await queryOne(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [normalizedInput, normalizedInput]
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
        bio: user.bio,
        display_name: user.display_name || user.username
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
      'SELECT id, username, email, avatar_url, bio, display_name, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      ...user,
      display_name: user.display_name || user.username
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  const { bio, avatar_url } = req.body;
  try {
    const user = await queryOne('SELECT username, avatar_url FROM users WHERE id = $1', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newAvatarUrl = await uploadAvatar(avatar_url, user.avatar_url, user.username);

    await execute(
      'UPDATE users SET bio = $1, avatar_url = $2 WHERE id = $3',
      [bio, newAvatarUrl || user.avatar_url, req.user.id]
    );
    res.json({ message: 'Profile updated successfully', avatar_url: newAvatarUrl || user.avatar_url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- HIGH PERFORMANCE CONSOLIDATED & PROXY ROUTES ---

// Home Data Bundle: Fetches popular movies, top-rated, upcoming, popular TV, reviews, and ticker in 1 fast compressed call
app.get('/api/home/bundle', async (req, res) => {
  try {
    const [popularData, topRatedData, upcomingData, popularTvData, reviewsData, tickerData] = await Promise.all([
      fetchFromTMDB('/movie/popular').catch(() => ({ results: [] })),
      fetchFromTMDB('/movie/top_rated').catch(() => ({ results: [] })),
      fetchFromTMDB('/movie/upcoming').catch(() => ({ results: [] })),
      fetchFromTMDB('/tv/popular').catch(() => ({ results: [] })),
      query(
        `SELECT r.*, u.username, u.avatar_url 
         FROM reviews r 
         JOIN users u ON r.user_id = u.id 
         JOIN diary d ON r.diary_id = d.id
         WHERE r.review_text != '' AND d.status = 'watched'
         ORDER BY r.created_at DESC 
         LIMIT 20`
      ).catch(() => []),
      query(
        `SELECT d.id, d.tmdb_movie_id, d.media_type, d.rating, d.created_at, u.username, u.display_name, r.review_text
         FROM diary d
         JOIN users u ON d.user_id = u.id
         LEFT JOIN reviews r ON d.review_id = r.id
         WHERE d.status = 'watched'
         ORDER BY d.created_at DESC
         LIMIT 10`
      ).catch(() => [])
    ]);

    res.setHeader('Cache-Control', 'public, max-age=180, stale-while-revalidate=3600');
    res.json({
      popularMovies: popularData.results || [],
      topRatedMovies: topRatedData.results || [],
      upcomingMovies: upcomingData.results || [],
      popularTv: popularTvData.results || [],
      recentReviews: reviewsData,
      tickerItems: tickerData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Single-Call Full Media Bundle: Uses TMDB append_to_response to return details, credits, recommendations, videos, and watch providers in 1 request
app.get('/api/media/:mediaType/:id/full', async (req, res) => {
  const { mediaType, id } = req.params;
  try {
    const data = await fetchFromTMDB(`/${mediaType}/${id}`, {
      append_to_response: 'credits,recommendations,videos,watch/providers'
    });

    const fullBundle = {
      ...data,
      media_type: mediaType,
      credits: data.credits || { cast: [], crew: [] },
      recommendations: data.recommendations || { results: [] },
      videos: data.videos || { results: [] },
      providers: data['watch/providers'] || { results: {} }
    };

    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
    res.json(fullBundle);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Single-Call Full Movie Bundle (with auto TV fallback)
app.get('/api/movies/:id/full', async (req, res) => {
  const { id } = req.params;
  try {
    let data;
    let mediaType = 'movie';
    try {
      data = await fetchFromTMDB(`/movie/${id}`, {
        append_to_response: 'credits,recommendations,videos,watch/providers'
      });
    } catch (movieErr) {
      if (movieErr.status === 404) {
        data = await fetchFromTMDB(`/tv/${id}`, {
          append_to_response: 'credits,recommendations,videos,watch/providers'
        });
        mediaType = 'tv';
      } else {
        throw movieErr;
      }
    }

    const fullBundle = {
      ...data,
      media_type: mediaType,
      credits: data.credits || { cast: [], crew: [] },
      recommendations: data.recommendations || { results: [] },
      videos: data.videos || { results: [] },
      providers: data['watch/providers'] || { results: {} }
    };

    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
    res.json(fullBundle);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Batch Movie Info: Resolves multiple movie details in parallel
app.get('/api/movies/batch', async (req, res) => {
  const idsParam = req.query.ids;
  if (!idsParam) return res.json({});

  const ids = idsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)).slice(0, 40);
  try {
    const moviePromises = ids.map(async (id) => {
      try {
        const data = await fetchFromTMDB(`/movie/${id}`);
        return { id, data: { ...data, media_type: 'movie' } };
      } catch (err) {
        try {
          const tvData = await fetchFromTMDB(`/tv/${id}`);
          return { id, data: { ...tvData, media_type: 'tv' } };
        } catch (e) {
          return { id, data: null };
        }
      }
    });

    const results = await Promise.all(moviePromises);
    const movieMap = {};
    results.forEach(({ id, data }) => {
      if (data) movieMap[id] = data;
    });

    res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=86400');
    res.json(movieMap);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- TMDB MOVIE PROXY ROUTES ---

app.get('/api/movies/popular', async (req, res) => {
  try {
    const data = await fetchFromTMDB('/movie/popular', { page: req.query.page });
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/movies/top-rated', async (req, res) => {
  try {
    const data = await fetchFromTMDB('/movie/top_rated', { page: req.query.page });
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/movies/upcoming', async (req, res) => {
  try {
    const data = await fetchFromTMDB('/movie/upcoming', { page: req.query.page });
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TV / Web Series popular list
app.get('/api/tv/popular', async (req, res) => {
  try {
    const data = await fetchFromTMDB('/tv/popular', { page: req.query.page });
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TV / Web Series top-rated list
app.get('/api/tv/top-rated', async (req, res) => {
  try {
    const data = await fetchFromTMDB('/tv/top_rated', { page: req.query.page });
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Multi Search (searches movies, TV shows, and local users)
app.get('/api/movies/search', async (req, res) => {
  try {
    const queryStr = req.query.query || '';
    let tmdbData = { results: [] };
    
    if (queryStr) {
      try {
        tmdbData = await fetchFromTMDB('/search/multi', { query: queryStr, page: req.query.page });
      } catch (err) {
        console.error('TMDB multi search error:', err);
      }
    }

    let userResults = [];
    if (queryStr) {
      userResults = await query(
        `SELECT id, username, avatar_url, bio, 'user' AS media_type 
         FROM users 
         WHERE LOWER(username) LIKE $1 OR LOWER(bio) LIKE $1
         LIMIT 10`,
        [`%${queryStr.toLowerCase()}%`]
      );
    }

    const combinedResults = [
      ...userResults,
      ...(tmdbData.results || [])
    ];

    res.json({
      ...tmdbData,
      results: combinedResults
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Generic Media Details Route (supports both movie and tv)
app.get('/api/media/:mediaType/:id', async (req, res) => {
  const { mediaType, id } = req.params;
  try {
    const data = await fetchFromTMDB(`/${mediaType}/${id}`);
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
    res.json({ ...data, media_type: mediaType });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.get('/api/media/:mediaType/:id/credits', async (req, res) => {
  const { mediaType, id } = req.params;
  try {
    const data = await fetchFromTMDB(`/${mediaType}/${id}/credits`);
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.get('/api/media/:mediaType/:id/recommendations', async (req, res) => {
  const { mediaType, id } = req.params;
  try {
    const data = await fetchFromTMDB(`/${mediaType}/${id}/recommendations`);
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.get('/api/media/:mediaType/:id/videos', async (req, res) => {
  const { mediaType, id } = req.params;
  try {
    const data = await fetchFromTMDB(`/${mediaType}/${id}/videos`);
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.get('/api/media/:mediaType/:id/providers', async (req, res) => {
  const { mediaType, id } = req.params;
  try {
    const data = await fetchFromTMDB(`/${mediaType}/${id}/watch/providers`);
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
    res.json(data);
  } catch (error) {
    res.json({ results: {} }); // Graceful fallback
  }
});

app.get('/api/person/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [details, credits] = await Promise.all([
      fetchFromTMDB(`/person/${id}`),
      fetchFromTMDB(`/person/${id}/combined_credits`).catch(() => ({ cast: [], crew: [] }))
    ]);
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
    res.json({ ...details, credits });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.get('/api/movies/genres', async (req, res) => {
  try {
    const data = await fetchFromTMDB('/genre/movie/list');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Fallback movie details (compatibility and auto-detection fallback)
app.get('/api/movies/:id', async (req, res) => {
  try {
    const data = await fetchFromTMDB(`/movie/${req.params.id}`);
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
    res.json({ ...data, media_type: 'movie' });
  } catch (error) {
    if (error.status === 404) {
      try {
        const tvData = await fetchFromTMDB(`/tv/${req.params.id}`);
        res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
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
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.get('/api/movies/:id/recommendations', async (req, res) => {
  try {
    const data = await fetchFromTMDB(`/movie/${req.params.id}/recommendations`);
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// --- REVIEW ROUTES ---

// Create or update review
app.post('/api/reviews', authenticateToken, async (req, res) => {
  const { tmdb_movie_id, rating, review_text, media_type = 'movie' } = req.body;

  if (!tmdb_movie_id || rating === undefined) {
    return res.status(400).json({ error: 'Movie ID and rating are required' });
  }

  const cleanReviewText = review_text ? review_text.trim() : '';
  const hasText = cleanReviewText.length > 0;
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    await withTransaction(async (tx) => {
      // Find existing diary entry
      const existingDiary = await tx.queryOne(
        'SELECT id, review_id FROM diary WHERE user_id = $1 AND tmdb_movie_id = $2',
        [req.user.id, tmdb_movie_id]
      );

      if (existingDiary) {
        // Update diary rating
        await tx.execute(
          'UPDATE diary SET rating = $1 WHERE id = $2',
          [rating, existingDiary.id]
        );

        if (hasText) {
          if (existingDiary.review_id) {
            // Update review
            await tx.execute(
              'UPDATE reviews SET rating = $1, review_text = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
              [rating, cleanReviewText, existingDiary.review_id]
            );
          } else {
            // Create review and link to diary
            const newReviewId = 'rev_' + Math.random().toString(36).substr(2, 9);
            await tx.execute(
              'INSERT INTO reviews (id, diary_id, user_id, tmdb_movie_id, rating, review_text) VALUES ($1, $2, $3, $4, $5, $6)',
              [newReviewId, existingDiary.id, req.user.id, tmdb_movie_id, rating, cleanReviewText]
            );
            await tx.execute(
              'UPDATE diary SET review_id = $1 WHERE id = $2',
              [newReviewId, existingDiary.id]
            );
          }
        } else {
          // If review_text is empty, delete review if it existed
          if (existingDiary.review_id) {
            await tx.execute('DELETE FROM reviews WHERE id = $1', [existingDiary.review_id]);
            await tx.execute('UPDATE diary SET review_id = NULL WHERE id = $2', [existingDiary.id]);
          }
        }
      } else {
        // Create new diary entry
        const diaryId = 'dry_' + Math.random().toString(36).substr(2, 9);
        let finalReviewId = null;

        if (hasText) {
          finalReviewId = 'rev_' + Math.random().toString(36).substr(2, 9);
          await tx.execute(
            'INSERT INTO reviews (id, diary_id, user_id, tmdb_movie_id, rating, review_text) VALUES ($1, $2, $3, $4, $5, $6)',
            [finalReviewId, diaryId, req.user.id, tmdb_movie_id, rating, cleanReviewText]
          );
        }

        await tx.execute(
          'INSERT INTO diary (id, user_id, tmdb_movie_id, media_type, rating, watched_date, review_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [diaryId, req.user.id, tmdb_movie_id, media_type, rating, todayStr, finalReviewId, 'watched']
        );
      }
    });

    res.json({ message: 'Review / Log updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reviews for a movie
const handleGetMovieReviews = async (req, res) => {
  try {
    const movieId = req.params.movieId || req.params.id;
    const reviews = await query(
      `SELECT r.*, u.username, u.avatar_url 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       JOIN diary d ON r.diary_id = d.id
       WHERE r.tmdb_movie_id = $1 AND d.status = 'watched' AND r.review_text != ''
       ORDER BY r.created_at DESC`,
      [movieId]
    );
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

app.get('/api/reviews/movie/:movieId', handleGetMovieReviews);
app.get('/api/movies/:id/reviews', handleGetMovieReviews);

// Get rating distribution for a movie
const handleGetRatingDistribution = async (req, res) => {
  try {
    const movieId = req.params.movieId || req.params.id;
    const ratings = await query(
      `SELECT rating, COUNT(*) as count 
       FROM diary 
       WHERE tmdb_movie_id = $1 AND rating IS NOT NULL AND status = 'watched'
       GROUP BY rating`,
      [movieId]
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
};

app.get('/api/reviews/movie/:movieId/distribution', handleGetRatingDistribution);
app.get('/api/movies/:id/reviews/distribution', handleGetRatingDistribution);

// Get all reviews
app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await query(
      `SELECT r.*, u.username, u.avatar_url 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       JOIN diary d ON r.diary_id = d.id
       WHERE r.review_text != '' AND d.status = 'watched'
       ORDER BY r.created_at DESC 
       LIMIT 50`
    );
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user specific reviews (fast, indexed query)
app.get('/api/reviews/user/:userId', async (req, res) => {
  try {
    const reviews = await query(
      `SELECT r.*, u.username, u.avatar_url 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       JOIN diary d ON r.diary_id = d.id
       WHERE r.user_id = $1 AND r.review_text != '' AND d.status = 'watched'
       ORDER BY r.created_at DESC`,
      [req.params.userId]
    );
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
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

    await withTransaction(async (tx) => {
      await tx.execute('UPDATE diary SET review_id = NULL WHERE review_id = $1', [req.params.id]);
      await tx.execute('DELETE FROM reviews WHERE id = $1', [req.params.id]);
    });
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle Review Like
app.post('/api/reviews/:id/like', authenticateToken, async (req, res) => {
  const reviewId = req.params.id;
  const userId = req.user.id;
  try {
    const existing = await queryOne(
      'SELECT * FROM review_likes WHERE user_id = $1 AND review_id = $2',
      [userId, reviewId]
    );
    if (existing) {
      await execute('DELETE FROM review_likes WHERE user_id = $1 AND review_id = $2', [userId, reviewId]);
      const countRes = await queryOne('SELECT COUNT(*) as count FROM review_likes WHERE review_id = $1', [reviewId]);
      return res.json({ liked: false, count: parseInt(countRes?.count || 0) });
    } else {
      await execute('INSERT INTO review_likes (user_id, review_id) VALUES ($1, $2)', [userId, reviewId]);
      const countRes = await queryOne('SELECT COUNT(*) as count FROM review_likes WHERE review_id = $1', [reviewId]);
      return res.json({ liked: true, count: parseInt(countRes?.count || 0) });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Review Comments & Likes info
app.get('/api/reviews/:id/comments', async (req, res) => {
  const reviewId = req.params.id;
  try {
    const comments = await query(
      `SELECT c.*, u.username, u.avatar_url 
       FROM review_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.review_id = $1
       ORDER BY c.created_at ASC`,
      [reviewId]
    );
    const likesCount = await queryOne('SELECT COUNT(*) as count FROM review_likes WHERE review_id = $1', [reviewId]);
    res.json({ comments, likesCount: parseInt(likesCount?.count || 0) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add Comment to Review
app.post('/api/reviews/:id/comments', authenticateToken, async (req, res) => {
  const reviewId = req.params.id;
  const userId = req.user.id;
  const { comment_text } = req.body;
  if (!comment_text || !comment_text.trim()) {
    return res.status(400).json({ error: 'Comment text is required' });
  }
  try {
    const commentId = 'cm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    await execute(
      'INSERT INTO review_comments (id, review_id, user_id, comment_text) VALUES ($1, $2, $3, $4)',
      [commentId, reviewId, userId, comment_text.trim()]
    );
    const newComment = await queryOne(
      `SELECT c.*, u.username, u.avatar_url 
       FROM review_comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.id = $1`,
      [commentId]
    );
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Comment
app.delete('/api/reviews/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const comment = await queryOne('SELECT user_id FROM review_comments WHERE id = $1', [req.params.commentId]);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized to delete comment' });

    await execute('DELETE FROM review_comments WHERE id = $1', [req.params.commentId]);
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- CUSTOM LISTS ROUTES ---

// Create List
app.post('/api/lists', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { title, description, is_private } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'List title is required' });
  }
  try {
    const listId = 'lst_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    await execute(
      'INSERT INTO lists (id, user_id, title, description, is_private) VALUES ($1, $2, $3, $4, $5)',
      [listId, userId, title.trim(), description || '', is_private ? 1 : 0]
    );
    const list = await queryOne('SELECT * FROM lists WHERE id = $1', [listId]);
    res.status(201).json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get User's Lists
app.get('/api/lists/user/:username', async (req, res) => {
  const normalizedUsername = req.params.username.trim().toLowerCase();
  try {
    const targetUser = await queryOne('SELECT id FROM users WHERE username = $1', [normalizedUsername]);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const lists = await query(
      `SELECT l.*, u.username, u.avatar_url,
         (SELECT COUNT(*) FROM list_items li WHERE li.list_id = l.id) as item_count,
         (SELECT COUNT(*) FROM list_likes ll WHERE ll.list_id = l.id) as likes_count
       FROM lists l
       JOIN users u ON l.user_id = u.id
       WHERE l.user_id = $1
       ORDER BY l.created_at DESC`,
      [targetUser.id]
    );
    res.json(lists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Single List
app.get('/api/lists/:id', async (req, res) => {
  try {
    const list = await queryOne(
      `SELECT l.*, u.username, u.avatar_url
       FROM lists l
       JOIN users u ON l.user_id = u.id
       WHERE l.id = $1`,
      [req.params.id]
    );
    if (!list) return res.status(404).json({ error: 'List not found' });

    const items = await query(
      `SELECT * FROM list_items WHERE list_id = $1 ORDER BY added_at DESC`,
      [req.params.id]
    );

    const likes = await queryOne('SELECT COUNT(*) as count FROM list_likes WHERE list_id = $1', [req.params.id]);

    res.json({ ...list, items, likes_count: parseInt(likes?.count || 0) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add item to list
app.post('/api/lists/:id/items', authenticateToken, async (req, res) => {
  const listId = req.params.id;
  const { tmdb_movie_id, media_type, title, poster_path, release_date } = req.body;
  try {
    const list = await queryOne('SELECT user_id FROM lists WHERE id = $1', [listId]);
    if (!list) return res.status(404).json({ error: 'List not found' });
    if (list.user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    await execute(
      `INSERT INTO list_items (list_id, tmdb_movie_id, media_type, title, poster_path, release_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (list_id, tmdb_movie_id) DO UPDATE SET title = EXCLUDED.title, poster_path = EXCLUDED.poster_path`,
      [listId, tmdb_movie_id, media_type || 'movie', title, poster_path, release_date]
    );
    res.json({ message: 'Item added to list successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove item from list
app.delete('/api/lists/:id/items/:movieId', authenticateToken, async (req, res) => {
  try {
    const list = await queryOne('SELECT user_id FROM lists WHERE id = $1', [req.params.id]);
    if (!list) return res.status(404).json({ error: 'List not found' });
    if (list.user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    await execute('DELETE FROM list_items WHERE list_id = $1 AND tmdb_movie_id = $2', [req.params.id, req.params.movieId]);
    res.json({ message: 'Item removed from list' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete List
app.delete('/api/lists/:id', authenticateToken, async (req, res) => {
  try {
    const list = await queryOne('SELECT user_id FROM lists WHERE id = $1', [req.params.id]);
    if (!list) return res.status(404).json({ error: 'List not found' });
    if (list.user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized to delete list' });

    await execute('DELETE FROM lists WHERE id = $1', [req.params.id]);
    res.json({ message: 'List deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get User Cinephile Stats
app.get('/api/users/profile/:username/stats', async (req, res) => {
  const normalizedUsername = req.params.username.trim().toLowerCase();
  try {
    const user = await queryOne('SELECT id FROM users WHERE username = $1', [normalizedUsername]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const totalMovies = await queryOne(
      `SELECT COUNT(*) as count FROM diary WHERE user_id = $1 AND (media_type IS NULL OR media_type = 'movie') AND status = 'watched'`,
      [user.id]
    );
    const totalTv = await queryOne(
      `SELECT COUNT(*) as count FROM diary WHERE user_id = $1 AND media_type = 'tv' AND status = 'watched'`,
      [user.id]
    );
    const totalReviews = await queryOne(
      `SELECT COUNT(*) as count FROM reviews WHERE user_id = $1 AND review_text != ''`,
      [user.id]
    );
    const totalWatchlist = await queryOne(
      `SELECT COUNT(*) as count FROM watchlist WHERE user_id = $1`,
      [user.id]
    );
    const totalLists = await queryOne(
      `SELECT COUNT(*) as count FROM lists WHERE user_id = $1`,
      [user.id]
    );
    const avgRating = await queryOne(
      `SELECT AVG(rating) as avg FROM diary WHERE user_id = $1 AND rating IS NOT NULL AND status = 'watched'`,
      [user.id]
    );

    res.json({
      moviesWatched: parseInt(totalMovies?.count || 0),
      tvWatched: parseInt(totalTv?.count || 0),
      reviewsCount: parseInt(totalReviews?.count || 0),
      watchlistCount: parseInt(totalWatchlist?.count || 0),
      listsCount: parseInt(totalLists?.count || 0),
      avgRating: avgRating?.avg ? parseFloat(parseFloat(avgRating.avg).toFixed(1)) : 0
    });
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
  const { tmdb_movie_id, media_type = 'movie', rating, watched_date, review_text, is_upcoming } = req.body;

  if (!tmdb_movie_id || !watched_date) {
    return res.status(400).json({ error: 'Movie ID and watched date are required' });
  }

  // Determine target status
  let isUpcomingVal = false;
  if (is_upcoming !== undefined) {
    isUpcomingVal = !!is_upcoming;
  } else {
    try {
      const movieDetails = await fetchFromTMDB(`/${media_type}/${tmdb_movie_id}`);
      const releaseDate = movieDetails.release_date || movieDetails.first_air_date;
      if (releaseDate && new Date(releaseDate) > new Date()) {
        isUpcomingVal = true;
      }
    } catch (err) {
      console.error('Failed to auto-detect release status from TMDB during logging, defaulting to watched:', err.message);
    }
  }

  const targetStatus = isUpcomingVal ? 'planned' : 'watched';
  const cleanReviewText = review_text ? review_text.trim() : '';
  const hasText = cleanReviewText.length > 0;
  
  // Rating is optional, set to null if 0/undefined
  const finalRating = (rating !== undefined && rating !== null && rating !== 0) ? rating : null;

  try {
    await withTransaction(async (tx) => {
      // Find existing diary entry for user/movie
      const existingDiary = await tx.queryOne(
        'SELECT id, review_id FROM diary WHERE user_id = $1 AND tmdb_movie_id = $2',
        [req.user.id, tmdb_movie_id]
      );

      if (existingDiary) {
        // Update diary entry
        await tx.execute(
          'UPDATE diary SET media_type = $1, rating = $2, watched_date = $3, status = $4 WHERE id = $5',
          [media_type, finalRating, watched_date, targetStatus, existingDiary.id]
        );

        if (hasText) {
          if (existingDiary.review_id) {
            // Update existing review
            await tx.execute(
              'UPDATE reviews SET rating = $1, review_text = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
              [finalRating || 0, cleanReviewText, existingDiary.review_id]
            );
          } else {
            // Create review and link to diary
            const newReviewId = 'rev_' + Math.random().toString(36).substr(2, 9);
            await tx.execute(
              'INSERT INTO reviews (id, diary_id, user_id, tmdb_movie_id, rating, review_text) VALUES ($1, $2, $3, $4, $5, $6)',
              [newReviewId, existingDiary.id, req.user.id, tmdb_movie_id, finalRating || 0, cleanReviewText]
            );
            await tx.execute(
              'UPDATE diary SET review_id = $1 WHERE id = $2',
              [newReviewId, existingDiary.id]
            );
          }
        } else {
          // If no review text is provided, delete review record if it existed
          if (existingDiary.review_id) {
            await tx.execute('DELETE FROM reviews WHERE id = $1', [existingDiary.review_id]);
            await tx.execute('UPDATE diary SET review_id = NULL WHERE id = $2', [existingDiary.id]);
          }
        }
      } else {
        // Create new diary entry
        const diaryId = 'dry_' + Math.random().toString(36).substr(2, 9);
        let finalReviewId = null;

        if (hasText) {
          finalReviewId = 'rev_' + Math.random().toString(36).substr(2, 9);
          await tx.execute(
            'INSERT INTO reviews (id, diary_id, user_id, tmdb_movie_id, rating, review_text) VALUES ($1, $2, $3, $4, $5, $6)',
            [finalReviewId, diaryId, req.user.id, tmdb_movie_id, finalRating || 0, cleanReviewText]
          );
        }

        await tx.execute(
          'INSERT INTO diary (id, user_id, tmdb_movie_id, media_type, rating, watched_date, review_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [diaryId, req.user.id, tmdb_movie_id, media_type, finalRating, watched_date, finalReviewId, targetStatus]
        );
      }
    });

    res.status(201).json({ message: 'Diary entry successfully updated/created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's diary
app.get('/api/diary/user/:userId', async (req, res) => {
  try {
    const diary = await query(
      "SELECT * FROM diary WHERE user_id = $1 AND status = 'watched' ORDER BY watched_date DESC, created_at DESC",
      [req.params.userId]
    );
    res.json(diary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if movie is watched
const handleCheckWatched = async (req, res) => {
  try {
    const existing = await queryOne(
      "SELECT 1 FROM diary WHERE user_id = $1 AND tmdb_movie_id = $2 AND status = 'watched' LIMIT 1",
      [req.user.id, req.params.movieId]
    );
    res.json({ watched: !!existing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Toggle watched status handler
const handleToggleWatched = async (req, res) => {
  const { tmdb_movie_id, media_type = 'movie', is_upcoming } = req.body;
  if (!tmdb_movie_id) return res.status(400).json({ error: 'Movie ID required' });

  try {
    const existing = await queryOne(
      'SELECT id, review_id, status FROM diary WHERE user_id = $1 AND tmdb_movie_id = $2 LIMIT 1',
      [req.user.id, tmdb_movie_id]
    );

    if (existing) {
      await withTransaction(async (tx) => {
        if (existing.review_id) {
          await tx.execute('DELETE FROM reviews WHERE id = $1', [existing.review_id]);
        }
        await tx.execute('DELETE FROM reviews WHERE user_id = $1 AND tmdb_movie_id = $2', [req.user.id, tmdb_movie_id]);
        await tx.execute('DELETE FROM diary WHERE user_id = $1 AND tmdb_movie_id = $2', [req.user.id, tmdb_movie_id]);
      });
      res.json({ watched: false, status: 'unwatched' });
    } else {
      // Determine if upcoming
      let isUpcomingVal = false;
      if (is_upcoming !== undefined) {
        isUpcomingVal = !!is_upcoming;
      } else {
        try {
          const movieDetails = await fetchFromTMDB(`/${media_type}/${tmdb_movie_id}`);
          const releaseDate = movieDetails.release_date || movieDetails.first_air_date;
          if (releaseDate && new Date(releaseDate) > new Date()) {
            isUpcomingVal = true;
          }
        } catch (err) {
          console.error('Failed to auto-detect release status from TMDB during toggle:', err.message);
        }
      }

      const targetStatus = isUpcomingVal ? 'planned' : 'watched';
      const diaryId = 'dry_' + Math.random().toString(36).substr(2, 9);
      const todayStr = new Date().toISOString().split('T')[0];

      await execute(
        'INSERT INTO diary (id, user_id, tmdb_movie_id, media_type, rating, watched_date, review_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [diaryId, req.user.id, tmdb_movie_id, media_type, null, todayStr, null, targetStatus]
      );
      res.json({ watched: targetStatus === 'watched', status: targetStatus });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

app.post('/api/diary/toggle-watched', authenticateToken, handleToggleWatched);
app.post('/api/watched/toggle', authenticateToken, handleToggleWatched);
app.get('/api/diary/check/:movieId', authenticateToken, handleCheckWatched);
app.get('/api/diary/check-watched/:movieId', authenticateToken, handleCheckWatched);
app.get('/api/watched/check/:movieId', authenticateToken, handleCheckWatched);

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
    const countResult = await queryOne("SELECT COUNT(*) as count FROM diary WHERE tmdb_movie_id = $1 AND status = 'planned'", [movieId]);
    const totalCount = countResult?.count || 0;

    let userExcited = false;
    if (currentUserId) {
      const userCheck = await queryOne("SELECT 1 FROM diary WHERE user_id = $1 AND tmdb_movie_id = $2 AND status = 'planned'", [currentUserId, movieId]);
      userExcited = !!userCheck;
    }

    res.json({ count: totalCount, excited: userExcited });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- SOCIAL / PROFILE ROUTES ---

// Suggested users to follow
app.get('/api/users/suggestions', authenticateToken, async (req, res) => {
  try {
    const suggestions = await query(
      `WITH user_movies AS (
        SELECT DISTINCT tmdb_movie_id FROM reviews WHERE user_id = $1
        UNION
        SELECT DISTINCT tmdb_movie_id FROM diary WHERE user_id = $1
        UNION
        SELECT DISTINCT tmdb_movie_id FROM watchlist WHERE user_id = $1
      ),
      mutual_matches AS (
        SELECT other.user_id, COUNT(*) as mutual_count
        FROM (
          SELECT user_id, tmdb_movie_id FROM reviews WHERE user_id != $1
          UNION
          SELECT user_id, tmdb_movie_id FROM diary WHERE user_id != $1
          UNION
          SELECT user_id, tmdb_movie_id FROM watchlist WHERE user_id != $1
        ) other
        JOIN user_movies um ON other.tmdb_movie_id = um.tmdb_movie_id
        GROUP BY other.user_id
      )
      SELECT u.id, u.username, u.avatar_url, u.bio, COALESCE(mm.mutual_count, 0) as mutual_count
      FROM users u
      LEFT JOIN mutual_matches mm ON u.id = mm.user_id
      WHERE u.id != $1
        AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id = $1)
      ORDER BY mutual_count DESC, u.created_at DESC
      LIMIT 10`,
      [req.user.id]
    );
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile details
app.get('/api/users/profile/:username', async (req, res) => {
  const normalizedUsername = req.params.username.trim().toLowerCase();
  const currentUserId = req.query.currentUserId || null;

  try {
    const user = await queryOne('SELECT id, username, avatar_url, bio, display_name, created_at FROM users WHERE username = $1', [normalizedUsername]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Fallback for display_name
    user.display_name = user.display_name || user.username;

    // Fetch stats
    const reviewsCount = await queryOne(
      'SELECT COUNT(*) as count FROM reviews r JOIN diary d ON r.diary_id = d.id WHERE r.user_id = $1 AND d.status = \'watched\'',
      [user.id]
    );
    const diaryCount = await queryOne(
      'SELECT COUNT(*) as count FROM diary WHERE user_id = $1 AND status = \'watched\'',
      [user.id]
    );
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
      'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, targetUserId]
    ).catch(async (err) => {
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
      `SELECT 'review' as type, r.id as activity_id, r.created_at AS created_at, r.rating AS rating, r.review_text AS review_text, r.tmdb_movie_id AS tmdb_movie_id, u.username AS username, u.avatar_url AS avatar_url, u.id as user_id
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN diary d ON r.diary_id = d.id
       WHERE r.user_id IN (SELECT following_id FROM follows WHERE follower_id = $1) AND r.review_text != '' AND d.status = 'watched'
       
       UNION ALL
       
       SELECT 'watch' as type, d.id as activity_id, d.created_at AS created_at, d.rating AS rating, NULL AS review_text, d.tmdb_movie_id AS tmdb_movie_id, u.username AS username, u.avatar_url AS avatar_url, u.id as user_id
       FROM diary d
       JOIN users u ON d.user_id = u.id
       LEFT JOIN reviews r ON d.review_id = r.id
       WHERE d.user_id IN (SELECT following_id FROM follows WHERE follower_id = $1)
         AND d.status = 'watched'
         AND (d.review_id IS NULL OR r.review_text = '')
       
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
  const normalizedUsername = req.params.username.trim().toLowerCase();
  try {
    const user = await queryOne('SELECT id FROM users WHERE username = $1', [normalizedUsername]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const dist = await query(
      `SELECT rating, COUNT(*) as count 
       FROM diary 
       WHERE user_id = $1 AND rating IS NOT NULL AND status = 'watched'
       GROUP BY rating 
       ORDER BY rating ASC`,
      [user.id]
    );
    res.json(dist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Live Community Activity Ticker (recent logs for home hero ticker)
app.get('/api/social/ticker', async (req, res) => {
  try {
    const recentLogs = await query(
      `SELECT d.id, d.tmdb_movie_id, d.media_type, d.rating, d.created_at, u.username, u.display_name, r.review_text
       FROM diary d
       JOIN users u ON d.user_id = u.id
       LEFT JOIN reviews r ON d.review_id = r.id
       WHERE d.status = 'watched'
       ORDER BY d.created_at DESC
       LIMIT 10`
    );
    res.json(recentLogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Cinephile Director Assistant Endpoint (Powered by Google Gemini AI)
app.post('/api/ai/recommend', async (req, res) => {
  const { prompt, genre, vibe } = req.body || {};
  const searchQuery = prompt || vibe || genre || 'masterpiece';

  try {
    const apiKey = process.env.GEMINI_API_KEY || GEMINI_API_KEY;
    if (apiKey) {
      console.log(`[GEMINI AI REQUEST] Prompt: "${searchQuery}"`);
      const geminiPrompt = `You are PlotHole AI Director's Cut, an elite cinephile film critic.
The user is requesting movie recommendations for this vibe/prompt: "${searchQuery}".
Provide 3 to 4 real, distinct, renowned film recommendations.

Return ONLY a JSON object matching this schema (do NOT use markdown backticks):
{
  "verdict": "A sharp, witty 1-2 sentence film critic analysis summarizing why these films fit the requested vibe",
  "recommendations": [
    {
      "search_title": "Exact film title to search in movie database",
      "curator_note": "A short, sharp 1-sentence cinephile commentary on this film",
      "match_score": 96
    }
  ]
}`;

      const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash-8b'];
      let geminiData = null;

      for (const model of models) {
        try {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: geminiPrompt }] }]
              })
            }
          );
          if (geminiRes.ok) {
            geminiData = await geminiRes.json();
            console.log(`[GEMINI AI SUCCESS] Generated content using model: ${model}`);
            break;
          } else if (geminiRes.status === 429) {
            console.log(`[GEMINI API INFO] API Key quota limit reached (429). Switching to PlotHole Cinema Engine...`);
            break;
          }
        } catch (err) {
          console.error(`[GEMINI API ERROR] Model ${model}:`, err.message);
        }
      }

      if (geminiData) {
        const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);

          const enrichedFilms = await Promise.all(
            (parsed.recommendations || []).slice(0, 5).map(async (rec) => {
              try {
                const searchRes = await fetchFromTMDB('/search/movie', { query: rec.search_title });
                const film = searchRes.results?.[0];
                if (film) {
                  return {
                    ...film,
                    curator_note: rec.curator_note,
                    match_score: rec.match_score || Math.floor(90 + Math.random() * 9)
                  };
                }
              } catch (e) {}
              return null;
            })
          );

          const validEnriched = enrichedFilms.filter(Boolean);
          if (validEnriched.length > 0) {
            return res.json({
              verdict: parsed.verdict || `PlotHole AI Director curated film selections for: "${searchQuery}"`,
              recommendations: validEnriched
            });
          }
        }
      }
    }

    // Fallback if Gemini API is unreachable or quota limited (429 Rate Limit)
    const tmdbRes = await fetchFromTMDB('/search/movie', { query: searchQuery });
    const results = (tmdbRes.results || []).slice(0, 5);

    const qLower = searchQuery.toLowerCase();
    const curatedRecommendations = results.map((movie, idx) => {
      let curatorNote = "Essential cinephile viewing with exceptional direction and atmosphere.";
      if (qLower.includes('mind') || qLower.includes('sci-fi') || qLower.includes('thriller')) {
        curatorNote = "A cerebral, mind-bending narrative with staggering psychological depth.";
      } else if (qLower.includes('action') || qLower.includes('fast') || qLower.includes('octane')) {
        curatorNote = "High-octane filmmaking with relentless pacing and visceral set pieces.";
      } else if (qLower.includes('noir') || qLower.includes('neon') || qLower.includes('mystery')) {
        curatorNote = "Atmospheric neo-noir masterpiece filled with shadow and moral ambiguity.";
      } else if (qLower.includes('drama') || qLower.includes('character')) {
        curatorNote = "A tour de force character study powered by raw emotional performances.";
      }

      return {
        ...movie,
        curator_note: curatorNote,
        match_score: Math.floor(91 + Math.random() * 8)
      };
    });

    res.json({
      verdict: `PlotHole AI Director curated ${curatedRecommendations.length} film selections matching "${searchQuery}"`,
      recommendations: curatedRecommendations
    });
  } catch (error) {
    console.error('[AI RECOMMENDATION ROUTE ERROR]:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export User Diary & Data
app.get('/api/users/profile/:username/export', async (req, res) => {
  const normalizedUsername = req.params.username.trim().toLowerCase();
  try {
    const user = await queryOne('SELECT id, username, display_name, bio FROM users WHERE username = $1', [normalizedUsername]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const diary = await query(
      `SELECT d.id, d.tmdb_movie_id, d.media_type, d.rating, d.watched_date, r.review_text
       FROM diary d
       LEFT JOIN reviews r ON d.review_id = r.id
       WHERE d.user_id = $1
       ORDER BY d.watched_date DESC`,
      [user.id]
    );

    const watchlist = await query(
      'SELECT tmdb_movie_id, created_at FROM watchlist WHERE user_id = $1',
      [user.id]
    );

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${user.username}_plothole_archive.json"`);
    res.json({
      exported_at: new Date().toISOString(),
      user: { username: user.username, display_name: user.display_name },
      stats: { diary_count: diary.length, watchlist_count: watchlist.length },
      diary,
      watchlist
    });
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

// Initialize database and start server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  // Fallback to start server even if DB fails initially, so health check doesn't fail
  app.listen(PORT, () => {
    console.log(`Server running in fallback mode on port ${PORT} (Database offline)`);
  });
});
