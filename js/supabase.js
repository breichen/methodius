const SUPABASE_URL =
  "https://mugyceuetxftttnnpawk.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_8Og9thBzbxTMuvDkGOmDZQ_tApzAZiA";

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );