export function hasSupabase() {
  return !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY
}

export const ENABLE_SMS = String(import.meta.env.VITE_ENABLE_SMS || '').toLowerCase() === 'true'

export function capacity() {
  const v = Number(import.meta.env.VITE_CAPACITY || 50)
  return Number.isFinite(v) && v > 0 ? v : 50
}

export function volunteerCount() {
  const v = Number(import.meta.env.VITE_VOLUNTEERS || 6)
  return Number.isFinite(v) && v >= 0 ? v : 6
}