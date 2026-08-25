import { defineConfig } from 'drizzle-kit'

try {
  process.loadEnvFile('.env.local')
} catch {
  // .env.local is optional; DATABASE_URL may come from the environment
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
