import { Pool } from 'pg';

// Use a global to avoid creating multiple pool instances during hot reloading in development
const globalForPg = global as unknown as { 
  pool: Pool | undefined;
  url: string | undefined;
};

if (process.env.NODE_ENV !== 'production') {
  // If the pool doesn't exist, OR if the .env url changed during a hot reload, create a new pool
  if (!globalForPg.pool || globalForPg.url !== process.env.DATABASE_URL) {
    // Optionally close the old pool to prevent memory leaks during dev
    if (globalForPg.pool) {
      globalForPg.pool.end().catch(console.error);
    }
    
    globalForPg.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    globalForPg.url = process.env.DATABASE_URL;
  }
}

export const pool = globalForPg.pool || new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
