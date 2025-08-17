/**
 * Database Connection Setup
 * PostgreSQL connection using Drizzle ORM
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { Config } from '../core/config.js';
import * as schema from '../../shared/schema.js';

// Create neon connection
const sql = neon(Config.DATABASE_URL);

// Create drizzle instance with schema
export const db = drizzle(sql, { schema });

// Export for type inference
export type Database = typeof db;