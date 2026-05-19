export async function onRequestPost({ request, env }) {
  const { slot_date, slot_time } = await request.json();

  if (!slot_date || !slot_time) {
    return new Response(JSON.stringify({ error: 'Missing slot_date or slot_time' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_KEY = env.SUPABASE_SECRET_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return new Response(JSON.stringify({ error: 'SUPABASE_URL or SUPABASE_SECRET_KEY env var is missing in Cloudflare' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/availability`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: 'return=representation'
    },
    body: JSON.stringify({ slot_date, slot_time, taken: false })
  });

  if (!res.ok) {
    const body = await res.text();
    let parsed = null;
    try { parsed = JSON.parse(body); } catch {}
    return new Response(JSON.stringify({
      error: parsed?.message || body || 'Database error',
      hint: parsed?.hint,
      code: parsed?.code,
      status: res.status
    }), { status: res.status, headers: { 'Content-Type': 'application/json' } });
  }

  const data = await res.json();
  return new Response(JSON.stringify(Array.isArray(data) ? (data[0] || {}) : data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
