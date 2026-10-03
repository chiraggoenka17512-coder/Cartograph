/**
 * Validates and exposes environment configuration.
 * Fails loudly on startup if any required environment variable is missing.
 */

function getRequiredEnv(name: string): string {
  const val = process.env[name];
  if (!val || val.trim() === "") {
    throw new Error(
      `[Cartograph Environment Error] Missing required environment variable: ${name}. Please define it in .env.local.`
    );
  }
  return val;
}

export const env = {
  clerk: {
    publishableKey: getRequiredEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"),
    secretKey: getRequiredEnv("CLERK_SECRET_KEY"),
  },
  supabase: {
    url: getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  },
} as const;
