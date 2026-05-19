export async function onRequestGet({ request, env }) {
  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_KEY = env.SUPABASE_SECRET_KEY;

  const url = new URL(request.url);
  const includeTaken = url.searchParams.get('all') === '1';

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
  let query = `slot_date=gte.${today}&order=slot_date.asc,slot_time.asc`;
  if (!includeTaken) query = `taken=eq.false&` + query;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/availability?${query}`, {
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
