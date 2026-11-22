import { createClient } from "@supabase/supabase-js";

// Серверний ключ. Никогда не добавляй NEXT_PUBLIC_ к этим переменным
export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY не заданы");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
