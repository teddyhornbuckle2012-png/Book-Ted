export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { firstName, lastName, email, phone, location, slotTime } = await req.json();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;
  const RESEND_KEY = process.env.RESEND_API_KEY;
  const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER;

  // 1. Save booking to Supabase
  const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      location,
      slot_time: slotTime,
      status: 'pending',
      paid: false
    })
  });

  if (!dbRes.ok) {
    return new Response('Database error', { status: 500 });
  }

  const message = `Hi ${firstName}! Your Book Ted request has been received.\n\nDetails:\nName: ${firstName} ${lastName}\nLocation: ${location}\nTime: ${slotTime}\n\nTed will review your request and confirm shortly. You will receive payment details only once confirmed.\n\nThe £5 deposit is fully refunded when Ted arrives. The £2.50 booking fee is non-refundable.`;

  // 2. Send email via Resend
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_KEY}`
    },
    body: JSON.stringify({
      from: 'Book Ted <bookings@yourdomain.com>',
      to: email,
      subject: 'BOOK TED — Booking Request Received',
      html: `
        <div style="background:#0a0a0a;color:#f0e8d8;font-family:Georgia,serif;padding:40px;max-width:560px;margin:0 auto;">
          <h1 style="font-family:serif;color:#C9A84C;letter-spacing:0.2em;font-size:28px;margin-bottom:8px;">BOOK TED</h1>
          <p style="color:#7a6530;font-style:italic;margin-bottom:32px;">A private appointment service</p>
          <h2 style="color:#C9A84C;font-size:16px;letter-spacing:0.15em;">REQUEST RECEIVED</h2>
          <p style="margin:20px 0;line-height:1.8;">Hi ${firstName},<br/><br/>Your booking request has been received. Ted will review it and confirm your slot shortly.</p>
          <div style="border-left:2px solid #C9A84C;padding:16px 20px;background:#111;margin:24px 0;">
            <p style="margin:0;line-height:2;color:#8a7a60;">
              <strong style="color:#C9A84C;">Name:</strong> ${firstName} ${lastName}<br/>
              <strong style="color:#C9A84C;">Location:</strong> ${location}<br/>
              <strong style="color:#C9A84C;">Time:</strong> ${slotTime}
            </p>
          </div>
          <p style="color:#8a7a60;font-style:italic;font-size:14px;line-height:1.8;">Payment will only be requested once Ted confirms your appointment.<br/>The £5 deposit is fully refunded when Ted arrives. The £2.50 booking fee is non-refundable.</p>
        </div>
      `
    })
  });

  // 3. Send SMS via Twilio
  const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`)
    },
    body: new URLSearchParams({
      From: TWILIO_FROM,
      To: phone,
      Body: message
    })
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const config = { path: '/api/submit-booking' };