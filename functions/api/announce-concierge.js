const jsonErr = (msg, status = 500) =>
  new Response(JSON.stringify({ error: msg }), { status, headers: { 'Content-Type': 'application/json' } });

function checkEnv(env) {
  const u = env.SUPABASE_URL;
  if (!u || !/^https:\/\/.+\.supabase\.co/.test(u)) {
    return 'SUPABASE_URL is missing or invalid on Cloudflare.';
  }
  if (!env.SUPABASE_SECRET_KEY) return 'SUPABASE_SECRET_KEY is not set on Cloudflare.';
  if (!env.RESEND_API_KEY) return 'RESEND_API_KEY is not set on Cloudflare.';
  return null;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function announcementHtml(firstName) {
  const greetingName = firstName ? escapeHtml(firstName) : 'esteemed guest';
  return `
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#050505;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#050505;">
  <tr><td align="center" style="padding:0;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#0a0a0a;border:1px solid #2a2318;border-top:2px solid #C9A84C;">

      <!-- Top gold gradient rule -->
      <tr><td style="height:2px;background:linear-gradient(90deg,#0a0a0a,#C9A84C,#0a0a0a);line-height:2px;font-size:2px;">&nbsp;</td></tr>

      <!-- Eyebrow + Logo -->
      <tr><td align="center" style="padding:46px 30px 8px;">
        <div style="font-family:Georgia,serif;font-size:10px;letter-spacing:0.35em;color:#7a6530;text-transform:uppercase;">A private appointment service</div>
      </td></tr>
      <tr><td align="center" style="padding:14px 20px 6px;">
        <div style="font-family:Georgia,serif;font-weight:900;font-size:54px;letter-spacing:0.18em;color:#C9A84C;line-height:1;">BOOK TED</div>
      </td></tr>
      <tr><td align="center" style="padding:14px 30px 30px;">
        <div style="font-family:Georgia,serif;font-style:italic;color:#8a7a60;font-size:15px;letter-spacing:0.06em;">Reserve your time, effortlessly.</div>
      </td></tr>

      <!-- Diamond divider -->
      <tr><td align="center" style="padding:6px 20px 26px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="width:120px;height:1px;background:linear-gradient(90deg,transparent,#7a6530);font-size:1px;line-height:1px;">&nbsp;</td>
          <td style="padding:0 14px;"><div style="width:8px;height:8px;background:#C9A84C;transform:rotate(45deg);"></div></td>
          <td style="width:120px;height:1px;background:linear-gradient(90deg,#7a6530,transparent);font-size:1px;line-height:1px;">&nbsp;</td>
        </tr></table>
      </td></tr>

      <!-- "Introducing" -->
      <tr><td align="center" style="padding:6px 30px 4px;">
        <div style="font-family:Georgia,serif;font-size:11px;letter-spacing:0.4em;color:#7a6530;text-transform:uppercase;">Now Available</div>
      </td></tr>
      <tr><td align="center" style="padding:14px 30px 6px;">
        <div style="font-family:Georgia,serif;font-weight:600;font-size:34px;letter-spacing:0.18em;color:#C9A84C;text-transform:uppercase;line-height:1.1;">The Concierge</div>
      </td></tr>
      <tr><td align="center" style="padding:14px 40px 30px;">
        <div style="font-family:Georgia,serif;font-style:italic;color:#a89870;font-size:17px;line-height:1.6;">Your personal guide to Book Ted.<br/>Available at any hour, on every page.</div>
      </td></tr>

      <!-- Visual: mock of the button -->
      <tr><td align="center" style="padding:10px 30px 22px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td align="center" style="background:#111111;border:1px solid #2a2318;padding:34px 40px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td align="center" style="padding-bottom:14px;">
                <div style="display:inline-block;width:68px;height:68px;border-radius:50%;background:#C9A84C;border:2px solid #E8D08A;line-height:64px;text-align:center;box-shadow:inset 0 0 0 2px #7a6530;">
                  <span style="font-family:Georgia,serif;font-size:34px;color:#0a0a0a;font-weight:900;">&#9993;</span>
                </div>
              </td>
            </tr><tr>
              <td align="center" style="font-family:Georgia,serif;font-size:11px;letter-spacing:0.3em;color:#7a6530;text-transform:uppercase;">Look for this in the corner</td>
            </tr></table>
          </td>
        </tr></table>
      </td></tr>

      <!-- Body copy -->
      <tr><td style="padding:6px 50px 4px;">
        <div style="font-family:Georgia,serif;font-size:16px;line-height:1.85;color:#f0e8d8;">
          Dear ${greetingName},
        </div>
      </td></tr>
      <tr><td style="padding:18px 50px 6px;">
        <div style="font-family:Georgia,serif;font-size:16px;line-height:1.85;color:#cbbe98;">
          Sir Teddy is delighted to unveil a new feature for the Book Ted experience. In the lower-right corner of every page, you will now find a small gold support button &mdash; The Concierge.
        </div>
      </td></tr>
      <tr><td style="padding:14px 50px 6px;">
        <div style="font-family:Georgia,serif;font-size:16px;line-height:1.85;color:#cbbe98;">
          A polite and attentive guide, the Concierge is on hand at any hour to walk you through the booking process, answer questions about locations, payment, and availability, and ensure that arranging time with Sir Teddy is as effortless as the service itself.
        </div>
      </td></tr>
      <tr><td style="padding:14px 50px 6px;">
        <div style="font-family:Georgia,serif;font-size:16px;line-height:1.85;color:#cbbe98;">
          Book Ted is now tailored to every screen you carry &mdash; desktop, tablet, mobile, and, for those so inclined, your <strong style="color:#C9A84C;font-weight:600;">Wear&nbsp;OS</strong> timepiece. Wherever the inspiration strikes, a booking is but a moment away.
        </div>
      </td></tr>
      <tr><td style="padding:14px 50px 28px;">
        <div style="font-family:Georgia,serif;font-size:16px;line-height:1.85;color:#cbbe98;">
          We invite you to pay the site a visit and try it for yourself.
        </div>
      </td></tr>

      <!-- CTA button -->
      <tr><td align="center" style="padding:10px 30px 44px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td align="center" style="background:linear-gradient(135deg,#1a1408,#2a2010);border:1px solid #C9A84C;">
            <a href="https://bookted.uk" style="display:inline-block;padding:18px 44px;font-family:Georgia,serif;font-size:13px;font-weight:600;letter-spacing:0.35em;color:#C9A84C;text-decoration:none;text-transform:uppercase;">Visit Book&nbsp;Ted</a>
          </td>
        </tr></table>
      </td></tr>

      <!-- Sign-off -->
      <tr><td align="center" style="padding:0 40px 30px;">
        <div style="font-family:Georgia,serif;font-style:italic;color:#8a7a60;font-size:15px;line-height:1.7;">With our regards,<br/>The Book Ted Office</div>
      </td></tr>

      <!-- Bottom diamonds -->
      <tr><td align="center" style="padding:4px 20px 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="padding:0 5px;"><div style="width:5px;height:5px;background:#7a6530;transform:rotate(45deg);"></div></td>
          <td style="padding:0 5px;"><div style="width:7px;height:7px;background:#C9A84C;transform:rotate(45deg);"></div></td>
          <td style="padding:0 5px;"><div style="width:5px;height:5px;background:#7a6530;transform:rotate(45deg);"></div></td>
        </tr></table>
      </td></tr>

      <!-- Bottom gold rule -->
      <tr><td style="height:1px;background:linear-gradient(90deg,transparent,#7a6530,transparent);line-height:1px;font-size:1px;">&nbsp;</td></tr>

      <!-- Footer / unsubscribe -->
      <tr><td align="center" style="padding:22px 40px 36px;">
        <div style="font-family:Georgia,serif;font-style:italic;color:#5a4e36;font-size:12px;line-height:1.7;">You are receiving this note because you have previously made a booking through bookted.uk.<br/>If you would prefer not to hear from us again, simply reply to this email and we shall remove you from future correspondence.</div>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}

async function fetchAllBookings(SUPABASE_URL, SUPABASE_KEY) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=email,first_name,created_at&order=created_at.desc`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error('bookings query failed: ' + body);
  }
  return res.json();
}

// GET -> dry-run: returns the unique recipient count without sending.
export async function onRequestGet({ env }) {
  try {
    const envErr = checkEnv(env);
    if (envErr) return jsonErr(envErr, 500);
    const bookings = await fetchAllBookings(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY);
    const seen = new Map();
    for (const b of bookings) {
      const e = String(b.email || '').trim().toLowerCase();
      if (!e || !e.includes('@')) continue;
      if (!seen.has(e)) seen.set(e, b.first_name || '');
    }
    return new Response(JSON.stringify({
      uniqueRecipients: seen.size,
      totalBookings: bookings.length,
      sampleEmails: Array.from(seen.keys()).slice(0, 5)
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return jsonErr('Server error: ' + (e?.message || String(e)), 500);
  }
}

// POST { confirm: 'SEND' } -> actually fires the emails.
export async function onRequestPost({ request, env }) {
  try {
    const envErr = checkEnv(env);
    if (envErr) return jsonErr(envErr, 500);

    let body = {};
    try { body = await request.json(); } catch {}
    if (body.confirm !== 'SEND') {
      return jsonErr('Refusing to send: include { "confirm": "SEND" } to actually dispatch the emails.', 400);
    }

    const bookings = await fetchAllBookings(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY);

    // Dedupe by lowercased email; keep the first_name we see first (most recent booking, since we ordered desc).
    const seen = new Map();
    for (const b of bookings) {
      const e = String(b.email || '').trim().toLowerCase();
      if (!e || !e.includes('@')) continue;
      if (!seen.has(e)) seen.set(e, b.first_name || '');
    }

    let sent = 0;
    let failed = 0;
    const failures = [];

    for (const [email, firstName] of seen) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: 'Book Ted <bookings@bookted.uk>',
            to: email,
            subject: 'BOOK TED — Introducing the Concierge',
            html: announcementHtml(firstName)
          })
        });
        if (res.ok) sent++;
        else {
          failed++;
          const txt = await res.text();
          failures.push({ email, error: txt.slice(0, 200) });
        }
      } catch (e) {
        failed++;
        failures.push({ email, error: e?.message || String(e) });
      }
    }

    return new Response(JSON.stringify({
      sent, failed, totalRecipients: seen.size, failures: failures.slice(0, 10)
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return jsonErr('Server error: ' + (e?.message || String(e)), 500);
  }
}
