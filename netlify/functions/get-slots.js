export default async (req) => {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;

  const url = new URL(req.url);
  const includeTaken = url.searchParams.get('all') === '1';

  const today = new Date().toISOString().slice(0, 10);
  let query = `slot_date=gte.${today}&order=slot_date.asc,slot_time.asc`;
  if (!includeTaken) query = `taken=eq.false&` + query;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/availability?${query}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });

  if (!res.ok) {
    return new Response('Database error', { status: 500 });
  }

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
