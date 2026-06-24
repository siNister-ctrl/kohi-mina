import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
    // directUrl for Supabase pgbouncer (optional — only needed with Supabase pooler)
    // directUrl: process.env.DIRECT_URL,
  },
});
