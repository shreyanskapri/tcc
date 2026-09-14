// Supabase browser configuration. The publishable/anon key is safe to expose in frontend code
// when Row Level Security is correctly configured (as in supabase-schema.sql).
const SUPABASE_URL = "https://tjzbvtsetjyzpkdffpay.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqemJ2dHNldGp5enBrZGZmcGF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzNjk3NTgsImV4cCI6MjEwNDk0NTc1OH0.j_7B_XBhvQbwIbDsW3MP_5Y02nx3Q7y-QxjUBW8oMkQ";
const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
