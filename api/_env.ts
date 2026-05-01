function read(name: string): string | null {
  const value = process.env[name];
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function getEnv(...names: string[]): string | null {
  for (const name of names) {
    const value = read(name);
    if (value) return value;
  }
  return null;
}

export function getRequiredEnv(label: string, ...names: string[]): string {
  const value = getEnv(...names);
  if (value) return value;
  throw new Error(`Missing env var: ${label} (checked: ${names.join(", ")})`);
}

export function getSupabaseUrl(): string {
  return getRequiredEnv(
    "SUPABASE_URL",
    "SUPABASE_URL",
    "VITE_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
  );
}

export function getSupabaseAnonKey(): string {
  return getRequiredEnv(
    "SUPABASE_ANON_KEY",
    "SUPABASE_ANON_KEY",
    "VITE_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );
}

export function getSupabaseServiceRoleKey(): string {
  return getRequiredEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SERVICE_KEY",
  );
}
