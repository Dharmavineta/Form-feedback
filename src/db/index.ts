import { drizzle } from "drizzle-orm/postgres-js";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql);
