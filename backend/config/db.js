import { Sequelize } from 'sequelize';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Explicitly import pg to ensure it's available for Sequelize
// This helps with Vercel serverless bundling
const { Client } = pg;

// Supabase PostgreSQL connection
// Supabase requires SSL for all connections
const sequelize = new Sequelize(
  process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
  {
    dialect: 'postgres',
    dialectModule: pg, // Explicitly provide the pg module
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 2, // Limit connections for serverless (each function instance)
      min: 0,
      acquire: 20000, // 20 second timeout for connection acquisition
      idle: 10000,
      evict: 1000, // Check for idle connections every second
      handleDisconnects: true // Automatically reconnect on disconnect
    },
    // For serverless: don't keep connections alive too long
    define: {
      freezeTableName: true,
      underscored: false
    }
  }
);

export default sequelize;
