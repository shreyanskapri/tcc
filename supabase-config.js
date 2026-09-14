// Supabase browser configuration. The publishable/anon key is safe to expose in frontend code
// when Row Level Security is correctly configured (as in supabase-schema.sql).

const NEXT_PUBLIC_SUPABASE_URL = "https://tjzbvtsetjyzpkdffpay.supabase.co";
const NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ka_ofvP1c37ejSWB9khfyQ_Ub9G_b_v";
const { createClient } = window.supabase;
const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
