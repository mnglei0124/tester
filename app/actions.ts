'use server';

import pool from '@/lib/db';

export async function getDatabaseStatus() {
  try {
    const start = Date.now();
    // Query simply runs and retrieves version to verify connection
    const result = await pool.query(`SELECT version(), current_database(), current_setting('server_version') as server_version`);
    const end = Date.now();
    
    return {
      status: 'online',
      version: result.rows[0].server_version,
      database: result.rows[0].current_database,
      latency: Math.round(end - start),
    };
  } catch (error) {
    // Silent fail as requested by user
    return {
      status: 'offline',
      version: null,
      database: null,
      latency: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
