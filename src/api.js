import { hasSupabaseConfig, supabaseApi } from "./supabase-api.js";

export async function api(url, options = {}) {
  if (hasSupabaseConfig) return supabaseApi(url, options);

  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Ошибка запроса");
  }
  return response.status === 204 ? null : response.json();
}
