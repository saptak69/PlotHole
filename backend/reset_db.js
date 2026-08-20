import { execute, query, initDb } from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function resetDatabase() {
  console.log('🚀 Starting Database Reset to Ground 0...');

  try {
    // Ensure tables exist before truncating/deleting
    await initDb();

    // Delete child tables first to respect foreign keys
    console.log('Clearing review comments...');
    await execute('DELETE FROM review_comments;');

    console.log('Clearing review likes...');
    await execute('DELETE FROM review_likes;');

    console.log('Clearing list likes...');
    await execute('DELETE FROM list_likes;');

    console.log('Clearing list items...');
    await execute('DELETE FROM list_items;');

    console.log('Clearing lists...');
    await execute('DELETE FROM lists;');

    console.log('Clearing diary logs...');
    await execute('DELETE FROM diary;');

    console.log('Clearing reviews...');
    await execute('DELETE FROM reviews;');

    console.log('Clearing watchlist...');
    await execute('DELETE FROM watchlist;');

    console.log('Clearing follows...');
    await execute('DELETE FROM follows;');

    console.log('Clearing users...');
    await execute('DELETE FROM users;');

    // Clean avatar uploads folder
    const uploadsDir = path.join(__dirname, 'uploads', 'avatars');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(uploadsDir, file));
        }
      }
      console.log(`Cleaned ${files.length} uploaded avatar files.`);
    }

    console.log('✅ Database successfully reset to Ground 0! All profiles and user records have been wiped.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  }
}

resetDatabase();
