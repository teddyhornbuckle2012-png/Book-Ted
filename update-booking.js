export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { id, status, email, firstName, location, slotTime } = await req.json();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;
  const RESEND_KEY = process.env.RESEND_API_KEY;

  // 1. Update booking status in Supabase
  const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    },
    body: JSON.stringify({ status })
  });

  if (!dbRes.ok) {
    return new Response('Database error', { status: 500 });
  }

  // 2. Send email to the person based on status
  const isConfirmed = status === 'confirmed';

  const subject = isConfirmed
    ? 'BOOK TED — Your Appointment is Confirmed!'
    : 'BOOK TED — Appointment Request Update';

  const html = isConfirmed ? `
    <div style="background:#0a0a0a;color:#f0e8d8;font-family:Georgia,serif;padding:40px;max-width:560px;margin:0 auto;">
      <h1 style="font-family:serif;color:#C9A84C;letter-spacing:0.2em;font-size:28px;margin-bottom:8px;">BOOK TED</h1>
      <p style="color:#7a6530;font-style:italic;margin-bottom:32px;">A private appointment service</p>
      <h2 style="color:#C9A84C;font-size:16px;letter-spacing:0.15em;">APPOINTMENT CONFIRMED</h2>
      <p style="margin:20px 0;line-height:1.8;">Hi ${firstName},<br/><br/>Your appointment has been confirmed by Ted! Please complete your payment to fully secure your slot.</p>
      <div style="border-left:2px solid #C9A84C;padding:16px 20px;background:#111;margin:24px 0;">
        <p style="margin:0;line-height:2;color:#8a7a60;">
          <strong style="color:#C9A84C;">Location:</strong> ${location}<br/>
          <strong style="color:#C9A84C;">Time:</strong> ${slotTime}<br/>
          <strong style="color:#C9A84C;">Amount Due:</strong> £7.50 (£2.50 booking fee + £5.00 deposit)
        </p>
      </div>
      <p style="color:#8a7a60;font-style:italic;font-size:14px;line-height:1.8;">
        The £5.00 deposit is fully refunded when Ted arrives.<br/>
        The £2.50 booking fee is non-refundable.<br/><br/>
        Ted will send your payment link shortly.
      </p>
    </div>
  ` : `
    <div style="background:#0a0a0a;color:#f0e8d8;font-family:Georgia,serif;padding:40px;max-width:560px;margin:0 auto;">
      <h1 style="font-family:serif;color:#C9A84C;letter-spacing:0.2em;font-size:28px;margin-bottom:8px;">BOOK TED</h1>
      <p style="color:#7a6530;font-style:italic;margin-bottom:32px;">A private appointment service</p>
      <h2 style="color:#C9A84C;font-size:16px;letter-spacing:0.15em;">APPOINTMENT UPDATE</h2>
      <p style="margin:20px 0;line-height:1.8;">Hi ${firstName},<br/><br/>Unfortunately Ted is unable to make the requested slot for <strong style="color:#f0e8d8;">${location}</strong> at <strong style="color:#f0e8d8;">${slotTime}</strong>.</p>
      <p style="color:#8a7a60;font-style:italic;font-size:14px;line-height:1.8;">Please feel free to submit a new booking request at a different time.</p>
    </div>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_KEY}`
    },
    body: JSON.stringify({
      from: 'Book Ted <onboarding@resend.dev>',
      to: email,
      subject,
      html
    })
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const config = { path: '/api/update-booking' };