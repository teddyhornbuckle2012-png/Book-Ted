const jsonErr = (msg, status = 500) =>
  new Response(JSON.stringify({ error: msg }), { status, headers: { 'Content-Type': 'application/json' } });

function checkEnv(env) {
  const u = env.SUPABASE_URL;
  if (!u || !/^https:\/\/.+\.supabase\.co/.test(u)) {
    return `SUPABASE_URL is missing or invalid on Cloudflare. It must be your Supabase project URL (e.g. https://xxxx.supabase.co), not a key. Seen: "${String(u).slice(0, 18)}…"`;
  }
  if (!env.SUPABASE_SECRET_KEY) return 'SUPABASE_SECRET_KEY is not set on Cloudflare.';
  if (!env.RESEND_API_KEY) return 'RESEND_API_KEY is not set on Cloudflare.';
  return null;
}

function locationMapsUrl(loc) {
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
  const q = map[loc] || encodeURIComponent((loc || '') + ' Chester');
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export async function onRequestPost({ request, env }) {
  try {
    const envErr = checkEnv(env);
    if (envErr) return jsonErr(envErr, 500);

    const { firstName, lastName, email, phone, location, slotTime, slotId } = await request.json();

    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_KEY = env.SUPABASE_SECRET_KEY;
    const RESEND_KEY = env.RESEND_API_KEY;
    const TED_EMAIL = 'teddyhornbuckle2012@gmail.com';
    const mapsUrl = locationMapsUrl(location);

    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        location,
        slot_time: slotTime,
        slot_id: slotId || null,
        status: 'pending',
        paid: false
      })
    });

    if (!dbRes.ok) {
      const body = await dbRes.text();
      let parsed = null;
      try { parsed = JSON.parse(body); } catch {}
      return jsonErr(parsed?.message || body || 'Database error', dbRes.status);
    }

    if (slotId) {
      await fetch(`${SUPABASE_URL}/rest/v1/availability?id=eq.${slotId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({ taken: true })
      });
    }

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({
        from: 'Book Ted <bookings@bookted.uk>',
        to: email,
        subject: 'BOOK TED — Appointment Request Received',
        html: `
          <div style="background:#0a0a0a;color:#f0e8d8;font-family:Georgia,serif;padding:40px;max-width:560px;margin:0 auto;">
            <h1 style="font-family:serif;color:#C9A84C;letter-spacing:0.2em;font-size:28px;margin-bottom:8px;">BOOK TED</h1>
            <p style="color:#7a6530;font-style:italic;margin-bottom:32px;">A private appointment service</p>
            <h2 style="color:#C9A84C;font-size:16px;letter-spacing:0.15em;">REQUEST RECEIVED</h2>
            <p style="margin:20px 0;line-height:1.8;">Your appointment request has been received and is awaiting review. A confirmation will be issued once the slot is approved.</p>
            <div style="border-left:2px solid #C9A84C;padding:16px 20px;background:#111;margin:24px 0;">
              <p style="margin:0;line-height:2;color:#8a7a60;">
                <strong style="color:#C9A84C;">Name:</strong> ${firstName} ${lastName}<br/>
                <strong style="color:#C9A84C;">Location:</strong> ${location}<br/>
                <strong style="color:#C9A84C;">Requested Time:</strong> ${slotTime}
              </p>
            </div>
            <p style="color:#8a7a60;font-size:14px;line-height:1.8;">
              A £2.50 non-refundable booking fee and £5.00 refundable deposit are payable upon confirmation. The deposit is returned in full upon Ted&rsquo;s arrival.
            </p>
            <a href="${mapsUrl}" style="display:inline-block;background:#1a1408;border:1px solid #C9A84C;color:#C9A84C;font-family:serif;font-size:13px;letter-spacing:0.2em;padding:14px 28px;text-decoration:none;margin-top:8px;">VIEW LOCATION ON GOOGLE MAPS</a>
          </div>
        `
      })
    });

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({
        from: 'Book Ted <bookings@bookted.uk>',
        to: TED_EMAIL,
        subject: 'BOOK TED — New Booking Request',
        html: `
          <div style="background:#0a0a0a;color:#f0e8d8;font-family:Georgia,serif;padding:40px;max-width:560px;margin:0 auto;">
            <h1 style="font-family:serif;color:#C9A84C;letter-spacing:0.2em;font-size:28px;margin-bottom:8px;">BOOK TED</h1>
            <p style="color:#7a6530;font-style:italic;margin-bottom:32px;">Admin Notification</p>
            <h2 style="color:#C9A84C;font-size:16px;letter-spacing:0.15em;">NEW BOOKING REQUEST</h2>
            <p style="margin:20px 0;line-height:1.8;">You have a new booking request waiting for your review.</p>
            <div style="border-left:2px solid #C9A84C;padding:16px 20px;background:#111;margin:24px 0;">
              <p style="margin:0;line-height:2;color:#8a7a60;">
                <strong style="color:#C9A84C;">Name:</strong> ${firstName} ${lastName}<br/>
                <strong style="color:#C9A84C;">Email:</strong> ${email}<br/>
                <strong style="color:#C9A84C;">Phone:</strong> ${phone}<br/>
                <strong style="color:#C9A84C;">Location:</strong> ${location}<br/>
                <strong style="color:#C9A84C;">Requested Time:</strong> ${slotTime}
              </p>
            </div>
          </div>
        `
      })
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return jsonErr('Server error: ' + (e?.message || String(e)), 500);
  }
}
