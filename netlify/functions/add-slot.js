export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { slot_date, slot_time } = await req.json();

  if (!slot_date || !slot_time) {
    return new Response('Missing slot_date or slot_time', { status: 400 });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/availability`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ slot_date, slot_time, taken: false })
  });

  if (!res.ok) {
    const body = await res.text();
    return new Response(body || 'Database error', { status: res.status });
  }

  const data = await res.json();
  return new Response(JSON.stringify(data[0] || data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
