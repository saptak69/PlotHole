import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let isPostgres = false;
let pgPool = null;
let sqliteDb = null;
let usingFallback = false;

if (process.env.DATABASE_URL) {
  console.log('Connecting to PostgreSQL/Supabase...');
  pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 3000,
    idleTimeoutMillis: 30000,
    max: 20,
    keepAlive: true
  });
  isPostgres = true;
} else {
  console.log('Using SQLite local database (Demo Mode)...');
  const sqlite3 = (await import('sqlite3')).default;
  const dbPath = path.join(__dirname, 'local.db');
  sqliteDb = new sqlite3.Database(dbPath);
}

// Status check helper
export function getDbStatus() {
  return {
    isPostgres,
    usingFallback,
    connected: isPostgres ? !!pgPool : !!sqliteDb
  };
}

// Helper to run query (returns array of rows)
export async function query(sql, params = []) {
  if (isPostgres) {
    const result = await pgPool.query(sql, params);
    return result.rows;
  } else {
    return new Promise((resolve, reject) => {
      // Translate Postgres $1, $2 params to SQLite ?1, ?2 params
      const sqliteSql = sql.replace(/\$(\d+)/g, '?$1');
      sqliteDb.all(sqliteSql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
}

// Helper to run a statement (INSERT/UPDATE/DELETE) and return info
export async function execute(sql, params = []) {
  if (isPostgres) {
    const result = await pgPool.query(sql, params);
    return { rowCount: result.rowCount, rows: result.rows };
  } else {
    return new Promise((resolve, reject) => {
      const sqliteSql = sql.replace(/\$(\d+)/g, '?$1');
      sqliteDb.run(sqliteSql, params, function (err) {
        if (err) reject(err);
        else resolve({ rowCount: this.changes, lastID: this.lastID });
      });
    });
  }
}

// Helper to get a single row
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

// Initialize tables
export async function initDb() {
  const usersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      bio TEXT,
      display_name TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const reviewsTable = `
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      diary_id TEXT,
      user_id TEXT NOT NULL,
      tmdb_movie_id INTEGER NOT NULL,
      rating REAL NOT NULL,
      review_text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (diary_id) REFERENCES diary(id) ON DELETE CASCADE
    );
  `;

  const watchlistTable = `
    CREATE TABLE IF NOT EXISTS watchlist (
      user_id TEXT NOT NULL,
      tmdb_movie_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, tmdb_movie_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  const diaryTable = `
    CREATE TABLE IF NOT EXISTS diary (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      tmdb_movie_id INTEGER NOT NULL,
      media_type TEXT DEFAULT 'movie',
      rating REAL,
      watched_date TEXT NOT NULL,
      review_id TEXT,
      status TEXT DEFAULT 'watched',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE SET NULL
    );
  `;

  const followsTable = `
    CREATE TABLE IF NOT EXISTS follows (
      follower_id TEXT NOT NULL,
      following_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (follower_id, following_id),
      FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  const reviewLikesTable = `
    CREATE TABLE IF NOT EXISTS review_likes (
      user_id TEXT NOT NULL,
      review_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, review_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
    );
  `;

  const reviewCommentsTable = `
    CREATE TABLE IF NOT EXISTS review_comments (
      id TEXT PRIMARY KEY,
      review_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      comment_text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  const listsTable = `
    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      is_private INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  const listItemsTable = `
    CREATE TABLE IF NOT EXISTS list_items (
      list_id TEXT NOT NULL,
      tmdb_movie_id INTEGER NOT NULL,
      media_type TEXT DEFAULT 'movie',
      title TEXT,
      poster_path TEXT,
      release_date TEXT,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (list_id, tmdb_movie_id),
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
    );
  `;

  const listLikesTable = `
    CREATE TABLE IF NOT EXISTS list_likes (
      list_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (list_id, user_id),
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  if (isPostgres) {
    try {
      // Test PostgreSQL connection
      await pgPool.query('SELECT 1');
      
      await pgPool.query(usersTable);
      await pgPool.query(reviewsTable);
      await pgPool.query(watchlistTable);
      await pgPool.query(diaryTable);
      await pgPool.query(followsTable);
      await pgPool.query(reviewLikesTable);
      await pgPool.query(reviewCommentsTable);
      await pgPool.query(listsTable);
      await pgPool.query(listItemsTable);
      await pgPool.query(listLikesTable);
      console.log('Database tables initialized successfully on PostgreSQL!');
    } catch (err) {
      if (process.env.NODE_ENV === 'production') {
        console.error('CRITICAL: PostgreSQL connection/initialization failed in PRODUCTION mode. Startup terminated.', err);
        process.exit(1);
      }
      console.error('PostgreSQL connection/initialization failed. Falling back to local SQLite database...', err);
      isPostgres = false;
      usingFallback = true;
      
      // Initialize SQLite fallback database
      const sqlite3 = (await import('sqlite3')).default;
      const dbPath = path.join(__dirname, 'local.db');
      sqliteDb = new sqlite3.Database(dbPath);
      
      await execute(usersTable);
      await execute(reviewsTable);
      await execute(watchlistTable);
      await execute(diaryTable);
      await execute(followsTable);
      await execute(reviewLikesTable);
      await execute(reviewCommentsTable);
      await execute(listsTable);
      await execute(listItemsTable);
      await execute(listLikesTable);
      console.log('Database tables initialized successfully on SQLite fallback database!');
    }
  } else {
    // SQLite requires running statements sequentially
    await execute(usersTable);
    await execute(reviewsTable);
    await execute(watchlistTable);
    await execute(diaryTable);
    await execute(followsTable);
    await execute(reviewLikesTable);
    await execute(reviewCommentsTable);
    await execute(listsTable);
    await execute(listItemsTable);
    await execute(listLikesTable);
    console.log('Database tables initialized successfully on SQLite database!');
  }

  // Safe migrations: Helper to run query safely
  const runMigration = async (sqlPostgres, sqlSqlite) => {
    try {
      if (isPostgres) {
        await pgPool.query(sqlPostgres);
      } else {
        await execute(sqlSqlite);
      }
    } catch (e) {
      // Column might already exist
    }
  };

  await runMigration('ALTER TABLE diary ADD COLUMN media_type TEXT DEFAULT \'movie\'', 'ALTER TABLE diary ADD COLUMN media_type TEXT DEFAULT \'movie\'');
  await runMigration('ALTER TABLE diary ADD COLUMN review_id TEXT', 'ALTER TABLE diary ADD COLUMN review_id TEXT');
  await runMigration('ALTER TABLE reviews ADD COLUMN diary_id TEXT', 'ALTER TABLE reviews ADD COLUMN diary_id TEXT');
  await runMigration('ALTER TABLE reviews ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP', 'ALTER TABLE reviews ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await runMigration('ALTER TABLE users ADD COLUMN display_name TEXT', 'ALTER TABLE users ADD COLUMN display_name TEXT');
  await runMigration('ALTER TABLE diary ADD COLUMN status TEXT DEFAULT \'watched\'', 'ALTER TABLE diary ADD COLUMN status TEXT DEFAULT \'watched\'');

  // Create database indexes for frequently queried fields
  const createIndexes = async () => {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);',
      'CREATE INDEX IF NOT EXISTS idx_reviews_movie_id ON reviews(tmdb_movie_id);',
      'CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_diary_user_id ON diary(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_diary_movie_id ON diary(tmdb_movie_id);',
      'CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);',
      'CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);',
      'CREATE INDEX IF NOT EXISTS idx_review_comments_review_id ON review_comments(review_id);',
      'CREATE INDEX IF NOT EXISTS idx_lists_user_id ON lists(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON list_items(list_id);'
    ];
    for (const sql of indexes) {
      try {
        if (isPostgres) {
          await pgPool.query(sql);
        } else {
          await execute(sql);
        }
      } catch (e) {
        // Index might already exist or error can be ignored
      }
    }
  };
  await createIndexes();
}

export async function withTransaction(callback) {
  if (isPostgres) {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const txQuery = (sql, params = []) => client.query(sql, params).then(r => r.rows);
      const txExecute = (sql, params = []) => client.query(sql, params).then(r => ({ rowCount: r.rowCount, rows: r.rows }));
      const txQueryOne = (sql, params = []) => txQuery(sql, params).then(rows => rows[0] || null);
      
      const result = await callback({ query: txQuery, execute: txExecute, queryOne: txQueryOne });
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } else {
    try {
      await execute('BEGIN');
      const txQueryOne = (sql, params = []) => query(sql, params).then(rows => rows[0] || null);
      const result = await callback({ query, execute, queryOne: txQueryOne });
      await execute('COMMIT');
      return result;
    } catch (error) {
      try {
        await execute('ROLLBACK');
      } catch (rollbackErr) {
        // Ignore rollback failure if transaction already terminated
      }
      throw error;
    }
  }
}
