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
      max: 2, // Reduced for serverless
      min: 0,
      acquire: 20000, // Reduced timeout
      idle: 5000 // Reduced idle time
    },
    retry: {
      max: 2 // Retry failed queries up to 2 times
    }
  }
);

export default sequelize;
