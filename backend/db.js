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
    }
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const reviewsTable = `
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      tmdb_movie_id INTEGER NOT NULL,
      rating REAL NOT NULL,
      review_text TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
      rating REAL,
      watched_date TEXT NOT NULL,
      review_text TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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

  if (isPostgres) {
    try {
      // Test PostgreSQL connection
      await pgPool.query('SELECT 1');
      
      await pgPool.query(usersTable);
      await pgPool.query(reviewsTable);
      await pgPool.query(watchlistTable);
      await pgPool.query(diaryTable);
      await pgPool.query(followsTable);
      console.log('Database tables initialized successfully on PostgreSQL!');
    } catch (err) {
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
      console.log('Database tables initialized successfully on SQLite fallback database!');
    }
  } else {
    // SQLite requires running statements sequentially
    await execute(usersTable);
    await execute(reviewsTable);
    await execute(watchlistTable);
    await execute(diaryTable);
    await execute(followsTable);
    console.log('Database tables initialized successfully on SQLite database!');
  }
}
