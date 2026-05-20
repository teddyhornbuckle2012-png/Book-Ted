const jsonErr = (msg, status = 500) =>
  new Response(JSON.stringify({ error: msg }), { status, headers: { 'Content-Type': 'application/json' } });

function checkEnv(env) {
  const u = env.SUPABASE_URL;
  if (!u || !/^https:\/\/.+\.supabase\.co/.test(u)) {
    return `SUPABASE_URL is missing or invalid on Cloudflare. It must be your Supabase project URL (e.g. https://xxxx.supabase.co), not a key. Seen: "${String(u).slice(0, 18)}…"`;
  }
  if (!env.SUPABASE_SECRET_KEY) return 'SUPABASE_SECRET_KEY is not set on Cloudflare.';
  return null;
}

export async function onRequestGet({ env }) {
  try {
    const envErr = checkEnv(env);
    if (envErr) return jsonErr(envErr, 500);

    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_KEY = env.SUPABASE_SECRET_KEY;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/bookings?order=created_at.desc`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });

    if (!res.ok) {
      const body = await res.text();
      let parsed = null;
      try { parsed = JSON.parse(body); } catch {}
      return jsonErr(parsed?.message || body || 'Database error', res.status);
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return jsonErr('Server error: ' + (e?.message || String(e)), 500);
  }
}
