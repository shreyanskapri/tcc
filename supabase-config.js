// Supabase browser configuration. The publishable/anon key is safe to expose in frontend code
// when Row Level Security is correctly configured (as in supabase-schema.sql).
const SUPABASE_URL = "https://tjzbvtsetjyzpkdffpay.supabase.co";
const SUPABASE_KEY = "sb_publishable_ka_ofvP1c37ejSWB9khfyQ_Ub9G_b_v";
const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
