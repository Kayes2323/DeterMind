import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY সেট নেই — DeterMind শুধু local storage-এ চলবে, cloud sync ছাড়াই।')
}

// DeterMind runs fully on local storage without login; Supabase is optional cloud sync,
// so a placeholder client keeps the app usable when it isn't configured.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)