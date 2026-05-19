export async function onRequestGet({ env }) {
  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_KEY = env.SUPABASE_SECRET_KEY;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/bookings?order=created_at.desc`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  if (!res.ok) {
    const body = await res.text();
    let parsed = null;
    try { parsed = JSON.parse(body); } catch {}
    return new Response(JSON.stringify({ error: parsed?.message || body || 'Database error' }), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
