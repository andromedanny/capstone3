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
  const urlParts = new URL(databaseUrl);
  console.log(`🔌 Database: ${urlParts.hostname}${urlParts.port ? ':' + urlParts.port : ''}`);
  console.log(`🔌 Database: ${urlParts.pathname}`);
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
    acquire: 10000, // 10 second timeout - fail fast if database is slow
    idle: 10000,
    evict: 1000, // Check for idle connections every second
    handleDisconnects: true // Automatically reconnect on disconnect
  },
  // For serverless: don't keep connections alive too long
  define: {
    freezeTableName: true,
    underscored: false
  }
});

// Test connection on initialization (only in development)
if (process.env.NODE_ENV === 'development') {
  sequelize.authenticate()
    .then(() => {
      console.log('✅ Database connection established successfully');
    })
    .catch((err) => {
      console.error('❌ Unable to connect to database:', err.message);
    });
}

export default sequelize;
