/*
 * Supabase table schema — run once in the Supabase SQL editor:
 *
 * CREATE TABLE users (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   strava_id bigint UNIQUE NOT NULL,
 *   name text,
 *   email text,
 *   access_token text,
 *   refresh_token text,
 *   expires_at bigint,
 *   created_at timestamptz DEFAULT now()
 * );
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function upsertUser({ strava_id, name, email, access_token, refresh_token, expires_at }) {
  const { data, error } = await supabase
    .from('users')
    .upsert({ strava_id, name, email, access_token, refresh_token, expires_at }, { onConflict: 'strava_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getUserByStravaId(strava_id) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('strava_id', strava_id)
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data;
}

async function updateTokens(strava_id, { access_token, refresh_token, expires_at }) {
  const { error } = await supabase
    .from('users')
    .update({ access_token, refresh_token, expires_at })
    .eq('strava_id', strava_id);

  if (error) throw error;
}

module.exports = { supabase, upsertUser, getUserByStravaId, updateTokens };
