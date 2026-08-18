/* Public Supabase connection details. This key is safe to include in the website. */
const NCO_SUPABASE_URL = "https://ftsqsqhuqafjhwhtgbna.supabase.co";
const NCO_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_wKdix5vbJnjLa3JIcOl4BQ_WcPZU6zv";
const ncoSupabase = window.supabase.createClient(NCO_SUPABASE_URL, NCO_SUPABASE_PUBLISHABLE_KEY);
