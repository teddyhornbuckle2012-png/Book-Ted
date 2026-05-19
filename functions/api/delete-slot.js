export async function onRequestPost({ request, env }) {
  const { id } = await request.json();
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_KEY = env.SUPABASE_SECRET_KEY;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/availability?id=eq.${id}`, {
    method: 'DELETE',
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

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
