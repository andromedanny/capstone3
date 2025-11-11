import { Sequelize } from 'sequelize';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Explicitly import pg to ensure it's available for Sequelize
// This helps with Vercel serverless bundling
const { Client } = pg;

// Get database URL from environment variables
const databaseUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('⚠️ DATABASE_URL or SUPABASE_DB_URL environment variable is not set!');
  console.error('⚠️ Please set SUPABASE_DB_URL or DATABASE_URL in your environment variables');
} else {
  // Log connection info (without sensitive data)
  try {
    const urlParts = new URL(databaseUrl);
    console.log(`🔌 Database host: ${urlParts.hostname}${urlParts.port ? ':' + urlParts.port : ''}`);
    console.log(`🔌 Database name: ${urlParts.pathname.replace('/', '')}`);
  } catch (urlError) {
    console.log('🔌 Database URL is set (format validation skipped)');
  }
}

// Supabase PostgreSQL connection
// For serverless, use connection pooler URL if available (ends with .pooler.supabase.com)
// Otherwise use direct connection URL
const isPooler = databaseUrl && databaseUrl.includes('.pooler.supabase.com');

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  dialectModule: pg, // Explicitly provide the pg module
  dialectOptions: {
    ssl: databaseUrl && databaseUrl.includes('sslmode=require') ? {
      require: true,
      rejectUnauthorized: false
    } : {
      require: true,
      rejectUnauthorized: false
    },
    // For connection pooler, add additional options
    ...(isPooler && {
      application_name: 'structura-app'
    })
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 1, // Single connection for serverless to avoid connection overhead
    min: 0,
    acquire: 15000, // 15 second timeout for connection acquisition
    idle: 10000,
    evict: 1000, // Check for idle connections every second
    handleDisconnects: true, // Automatically reconnect on disconnect
    // For serverless: Close idle connections quickly
    idleTimeoutMillis: 30000 // Close idle connections after 30 seconds
  },
  // For serverless: don't keep connections alive too long
  define: {
    freezeTableName: true,
    underscored: false
  }
});

// For serverless: Don't test connection on module load
// Connection will be established on first query
// This prevents cold start issues in serverless environments

export default sequelize;
