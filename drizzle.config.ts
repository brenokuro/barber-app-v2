import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL || 
  `postgresql://${process.env.PGUSER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}/${process.env.PGDATABASE}?sslmode=require`;

if (!databaseUrl) {
  throw new Error("Database credentials not found");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
