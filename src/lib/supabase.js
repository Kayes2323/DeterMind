import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  document.body.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0f;color:#fff;font-family:sans-serif;padding:24px;text-align:center;">
      <div>
        <h1 style="color:#f97316;margin-bottom:12px;">DeterMind চালু করা যায়নি</h1>
        <p style="color:#aaa;max-width:480px;">VITE_SUPABASE_URL অথবা VITE_SUPABASE_ANON_KEY এনভায়রনমেন্ট ভ্যারিয়েবল পাওয়া যায়নি। Vercel প্রজেক্টের Settings → Environment Variables-এ এগুলো সেট করা আছে কিনা দেখুন, তারপর নতুন করে deploy করুন।</p>
      </div>
    </div>
  `
  throw new Error('Missing Supabase environment variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)