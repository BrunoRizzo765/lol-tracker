import { Pool } from "pg";

const globalForPg = globalThis as unknown as { _pgPool?: Pool };

export const pool =
  globalForPg._pgPool ?? new Pool({ connectionString: process.env.DATABASE_URL });

if (!globalForPg._pgPool) globalForPg._pgPool = pool;
