function locationMapsUrl(location) {
  const map = {
    'Costa St Michaels Sq': 'Costa+Coffee+Grosvenor+Shopping+Centre+St+Michaels+Square+Chester',
    'Costa Watergate St': 'Costa+Coffee+14+Watergate+Street+Chester',
    'Caffè Nero Eastgate St': 'Caff%C3%A8+Nero+19+Eastgate+Street+Chester',
    'Caffè Nero Bridge St': 'Caff%C3%A8+Nero+52+Bridge+Street+Chester',
    'Caffè Nero Foregate St': 'Caff%C3%A8+Nero+74+Foregate+Street+Chester',
    'Starbucks Foregate St': 'Starbucks+18+Foregate+Street+Chester',
    'Starbucks Northgate St': 'Starbucks+18+Northgate+Street+Chester',
    'EL&N Harrods Beauty': 'EL%26N+Harrods+Beauty+Grosvenor+Shopping+Centre+Chester'
  };
  const query = map[location] || encodeURIComponent((location || '') + ' Chester');
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function londonDate(daysAhead = 0) {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' });
  const [y, m, d] = fmt.format(new Date()).split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  t.setUTCDate(t.getUTCDate() + daysAhead);
  const yy = t.getUTCFullYear();
  const mm = String(t.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(t.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function reminderHtml({ firstName, location, slotTime, daysUntil, mapsUrl }) {
  const window = daysUntil === 1 ? 'one day' : 'three days';
  return `
    <div style="background:#0a0a0a;color:#f0e8d8;font-family:Georgia,serif;padding:40px;max-width:560px;margin:0 auto;">
      <h1 style="font-family:serif;color:#C9A84C;letter-spacing:0.2em;font-size:28px;margin-bottom:8px;">BOOK TED</h1>
      <p style="color:#7a6530;font-style:italic;margin-bottom:32px;">A private appointment service</p>
      <h2 style="color:#C9A84C;font-size:16px;letter-spacing:0.15em;">APPOINTMENT REMINDER</h2>
      <p style="margin:20px 0;line-height:1.8;">This is a reminder of your confirmed appointment, ${window} from today.</p>
      <div style="border-left:2px solid #C9A84C;padding:16px 20px;background:#111;margin:24px 0;">
        <p style="margin:0;line-height:2;color:#8a7a60;">
          <strong style="color:#C9A84C;">Location:</strong> ${location}<br/>
          <strong style="color:#C9A84C;">Time:</strong> ${slotTime}
        </p>
      </div>
      <a href="${mapsUrl}" style="display:inline-block;background:#1a1408;border:1px solid #C9A84C;color:#C9A84C;font-family:serif;font-size:13px;letter-spacing:0.2em;padding:14px 28px;text-decoration:none;">VIEW LOCATION ON GOOGLE MAPS</a>
      <p style="color:#8a7a60;font-style:italic;font-size:14px;line-height:1.8;margin-top:28px;">
        Please arrive on time. If you can no longer attend, reply to this email at your earliest convenience.
      </p>
    </div>
  `;
}

export async function onRequest({ env }) {
 try {
  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_KEY = env.SUPABASE_SECRET_KEY;
  const RESEND_KEY = env.RESEND_API_KEY;

  if (!SUPABASE_URL || !/^https:\/\/.+\.supabase\.co/.test(SUPABASE_URL)) {
    return new Response(JSON.stringify({ error: 'SUPABASE_URL missing or invalid' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const target1 = londonDate(1);
  const target3 = londonDate(3);

  const availRes = await fetch(
    `${SUPABASE_URL}/rest/v1/availability?slot_date=in.(${target1},${target3})`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );

  if (!availRes.ok) {
    const body = await availRes.text();
    return new Response(JSON.stringify({ error: 'availability query failed', detail: body }), { status: 500 });
  }

  const availSlots = await availRes.json();
  if (!Array.isArray(availSlots) || availSlots.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: 'no slots on target dates', target1, target3 }), { status: 200 });
  }

  const idList = availSlots.map(s => s.id).join(',');
  const bookingsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/bookings?status=eq.confirmed&slot_id=in.(${idList})`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );

  if (!bookingsRes.ok) {
    const body = await bookingsRes.text();
    return new Response(JSON.stringify({ error: 'bookings query failed', detail: body }), { status: 500 });
  }

  const bookings = await bookingsRes.json();
  let sent = 0;

  for (const b of bookings) {
    const slot = availSlots.find(s => s.id === b.slot_id);
    if (!slot) continue;
    const daysUntil = slot.slot_date === target1 ? 1 : 3;
    const mapsUrl = locationMapsUrl(b.location);

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_KEY}`
      },
      body: JSON.stringify({
        from: 'Book Ted <bookings@bookted.uk>',
        to: b.email,
        subject: `BOOK TED — Appointment Reminder (${daysUntil === 1 ? '1 day' : '3 days'} to go)`,
        html: reminderHtml({
          firstName: b.first_name,
          location: b.location,
          slotTime: b.slot_time,
          daysUntil,
          mapsUrl
        })
      })
    });

    sent++;
  }

  return new Response(JSON.stringify({ sent, target1, target3 }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
 } catch (e) {
  return new Response(JSON.stringify({ error: 'Server error: ' + (e?.message || String(e)) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
 }
}
