import { Pool } from "pg";
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

const connectionString = isProduction
  ? process.env.DATABASE_URL
  : `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;

const pool = new Pool({
  connectionString: connectionString,

  //* For vercel production server
  ssl: {
    rejectUnauthorized:false,
    // ca: process.env.DATABASE_CA,
  },
});

export default pool;
