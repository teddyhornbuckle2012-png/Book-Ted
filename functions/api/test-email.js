const jsonErr = (msg, status = 500) =>
  new Response(JSON.stringify({ error: msg }), { status, headers: { 'Content-Type': 'application/json' } });

export async function onRequestPost({ request, env }) {
  try {
    if (!env.RESEND_API_KEY) return jsonErr('RESEND_API_KEY is not set on Cloudflare.', 500);

    let to = 'jadelouisedixon2015@yahoo.com';
    try {
      const body = await request.json();
      if (body && body.to) to = String(body.to).trim();
    } catch {}

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Book Ted <bookings@bookted.uk>',
        to,
        subject: 'BOOK TED — Test Email',
        html: `
          <div style="background:#0a0a0a;color:#f0e8d8;font-family:Georgia,serif;padding:40px;max-width:560px;margin:0 auto;">
            <h1 style="font-family:serif;color:#C9A84C;letter-spacing:0.2em;font-size:28px;margin-bottom:8px;">BOOK TED</h1>
            <p style="color:#7a6530;font-style:italic;margin-bottom:32px;">A private appointment service</p>
            <h2 style="color:#C9A84C;font-size:16px;letter-spacing:0.15em;">TEST EMAIL</h2>
            <p style="margin:20px 0;line-height:1.8;">This is a test message sent from the Book Ted admin panel. If you are reading this, email delivery is working correctly.</p>
          </div>
        `
      })
    });

    if (!res.ok) {
      const body = await res.text();
      return jsonErr('Email send failed: ' + body, 500);
    }

    return new Response(JSON.stringify({ success: true, to }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return jsonErr('Server error: ' + (e?.message || String(e)), 500);
  }
}
