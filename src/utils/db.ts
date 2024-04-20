import { Pool } from "pg";
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";
const connectionString = isProduction
  ? process.env.PRODUCTION_DB_URL
  : `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;

const pool = new Pool({
  connectionString: connectionString,

  //* For vercel deployment
  ssl: {
    rejectUnauthorized: false,
  },
});

export default pool;
