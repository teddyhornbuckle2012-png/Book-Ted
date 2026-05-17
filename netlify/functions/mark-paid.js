import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const GOLD = rgb(0.788, 0.659, 0.298);        // #C9A84C
const GOLD_LIGHT = rgb(0.910, 0.816, 0.541);  // #E8D08A
const GOLD_DIM = rgb(0.478, 0.396, 0.188);    // #7A6530
const BG = rgb(0.039, 0.039, 0.039);          // #0A0A0A
const SURFACE = rgb(0.067, 0.067, 0.067);     // #111111
const TEXT = rgb(0.941, 0.910, 0.847);        // #F0E8D8
const MUTED = rgb(0.541, 0.478, 0.376);       // #8A7A60

async function generateInvoicePdf(b) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4 portrait
  const { width, height } = page.getSize();

  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const sans = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Full black background
  page.drawRectangle({ x: 0, y: 0, width, height, color: BG });

  // Top gold gradient rule (simulated with three rects)
  page.drawRectangle({ x: 40, y: height - 36, width: width - 80, height: 1.6, color: GOLD });

  // Decorative corner brackets
  const drawCorner = (cx, cy, dx, dy) => {
    page.drawRectangle({ x: cx, y: cy, width: 14 * dx, height: 1.4, color: GOLD });
    page.drawRectangle({ x: cx, y: cy, width: 1.4, height: 14 * dy, color: GOLD });
  };
  drawCorner(40, height - 60, 1, -1);
  drawCorner(width - 40 - 14, height - 60, -1, -1);
  drawCorner(40, 60 + 14, 1, -1);
  drawCorner(width - 40 - 14, 60 + 14, -1, -1);

  // Header
  page.drawText('BOOK TED', { x: 50, y: height - 100, font: sans, size: 28, color: GOLD, characterSpacing: 6 });
  page.drawText('A private appointment service', {
    x: 50, y: height - 122, font: serifItalic, size: 11, color: GOLD_DIM
  });

  // INVOICE label (top right)
  page.drawText('INVOICE', { x: width - 160, y: height - 100, font: sans, size: 16, color: GOLD, characterSpacing: 4 });
  const invoiceNo = (b.bookingId || '00000000').slice(0, 8).toUpperCase();
  page.drawText(`No. ${invoiceNo}`, { x: width - 160, y: height - 118, font: serif, size: 10, color: MUTED });
  page.drawText(b.issuedAt, { x: width - 160, y: height - 132, font: serif, size: 10, color: MUTED });

  // Divider
  page.drawRectangle({ x: 50, y: height - 158, width: width - 100, height: 0.5, color: GOLD_DIM });

  // "BILLED TO" + "APPOINTMENT" sections
  const colY = height - 188;
  page.drawText('BILLED TO', { x: 50, y: colY, font: sans, size: 9, color: GOLD, characterSpacing: 3 });
  page.drawText(`${b.firstName} ${b.lastName}`, { x: 50, y: colY - 22, font: serif, size: 13, color: TEXT });
  page.drawText(b.email, { x: 50, y: colY - 40, font: serif, size: 10.5, color: MUTED });
  page.drawText(b.phone || '', { x: 50, y: colY - 56, font: serif, size: 10.5, color: MUTED });

  page.drawText('APPOINTMENT', { x: 320, y: colY, font: sans, size: 9, color: GOLD, characterSpacing: 3 });
  page.drawText(b.slotTime, { x: 320, y: colY - 22, font: serif, size: 13, color: TEXT });
  page.drawText(b.location, { x: 320, y: colY - 40, font: serif, size: 10.5, color: MUTED });

  // Items section
  let y = height - 290;
  page.drawRectangle({ x: 50, y, width: width - 100, height: 0.5, color: GOLD_DIM });

  y -= 24;
  page.drawText('DESCRIPTION', { x: 50, y, font: sans, size: 9, color: GOLD, characterSpacing: 3 });
  page.drawText('AMOUNT', { x: width - 110, y, font: sans, size: 9, color: GOLD, characterSpacing: 3 });

  y -= 12;
  page.drawRectangle({ x: 50, y, width: width - 100, height: 0.3, color: GOLD_DIM });

  // Item rows
  y -= 28;
  page.drawText('Non-refundable booking fee', { x: 50, y, font: serif, size: 12, color: TEXT });
  page.drawText('£2.50', { x: width - 110, y, font: serif, size: 12, color: TEXT });

  y -= 26;
  page.drawText('Refundable deposit', { x: 50, y, font: serif, size: 12, color: TEXT });
  page.drawText('£5.00', { x: width - 110, y, font: serif, size: 12, color: TEXT });
  page.drawText('(returned in full upon Ted’s arrival)', {
    x: 50, y: y - 13, font: serifItalic, size: 9.5, color: MUTED
  });

  y -= 38;
  page.drawRectangle({ x: 50, y, width: width - 100, height: 0.5, color: GOLD_DIM });

  // Total
  y -= 28;
  page.drawText('TOTAL PAID', { x: 50, y, font: sans, size: 11, color: GOLD, characterSpacing: 3 });
  page.drawText('£7.50', { x: width - 110, y, font: serifBold, size: 15, color: GOLD });

  // PAID stamp
  y -= 56;
  page.drawRectangle({
    x: 50, y: y - 6, width: 120, height: 40,
    borderColor: GOLD, borderWidth: 1.5, color: SURFACE
  });
  page.drawText('PAID', { x: 87, y: y + 8, font: sans, size: 18, color: GOLD, characterSpacing: 4 });
  page.drawText(`Received ${b.issuedAt}`, {
    x: 180, y: y + 12, font: serifItalic, size: 10, color: MUTED
  });

  // Footer note
  page.drawText('Thank you for your booking.', { x: 50, y: 130, font: serifItalic, size: 11, color: TEXT });
  page.drawText(
    'Your £5.00 deposit is fully refundable and will be returned to you when Ted arrives at',
    { x: 50, y: 113, font: serif, size: 10, color: MUTED }
  );
  page.drawText('your appointment. The £2.50 booking fee is non-refundable.', {
    x: 50, y: 100, font: serif, size: 10, color: MUTED
  });

  // Bottom rule with a small gold square (avoiding non-WinAnsi glyphs)
  page.drawRectangle({ x: 50, y: 70, width: width - 100, height: 0.8, color: GOLD_DIM });
  page.drawRectangle({ x: width / 2 - 3, y: 75, width: 6, height: 6, color: GOLD, rotate: { type: 'degrees', angle: 45 } });

  return await pdf.save();
}

function paymentReceivedHtml(b) {
  return `
    <div style="background:#0a0a0a;color:#f0e8d8;font-family:Georgia,serif;padding:40px;max-width:560px;margin:0 auto;">
      <h1 style="font-family:serif;color:#C9A84C;letter-spacing:0.2em;font-size:28px;margin-bottom:8px;">BOOK TED</h1>
      <p style="color:#7a6530;font-style:italic;margin-bottom:32px;">A private appointment service</p>
      <h2 style="color:#C9A84C;font-size:16px;letter-spacing:0.15em;">PAYMENT RECEIVED</h2>
      <p style="margin:20px 0;line-height:1.8;">Your payment of <strong style="color:#C9A84C;">£7.50</strong> has been received in full. Your appointment is now fully secured.</p>
      <div style="border-left:2px solid #C9A84C;padding:16px 20px;background:#111;margin:24px 0;">
        <p style="margin:0;line-height:2;color:#8a7a60;">
          <strong style="color:#C9A84C;">Location:</strong> ${b.location}<br/>
          <strong style="color:#C9A84C;">Time:</strong> ${b.slotTime}
        </p>
      </div>
      <p style="color:#8a7a60;font-size:14px;line-height:1.8;">Your invoice is attached to this email as a PDF for your records. The £5.00 deposit will be returned to you in full once Ted arrives.</p>
    </div>
  `;
}

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  const { id, firstName, lastName, email, phone, location, slotTime } = await req.json();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;
  const RESEND_KEY = process.env.RESEND_API_KEY;

  // 1. Flip paid=true in Supabase
  const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    },
    body: JSON.stringify({ paid: true })
  });

  if (!dbRes.ok) {
    const body = await dbRes.text();
    let parsed = null;
    try { parsed = JSON.parse(body); } catch {}
    return new Response(JSON.stringify({ error: parsed?.message || body || 'Database error' }), {
      status: dbRes.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 2. Build the invoice PDF
  const issuedAt = new Date().toLocaleDateString('en-GB', {
    timeZone: 'Europe/London', day: '2-digit', month: 'long', year: 'numeric'
  });

  const pdfBytes = await generateInvoicePdf({
    bookingId: id,
    firstName: firstName || '',
    lastName: lastName || '',
    email: email || '',
    phone: phone || '',
    location: location || '',
    slotTime: slotTime || '',
    issuedAt
  });

  const base64Pdf = Buffer.from(pdfBytes).toString('base64');

  // 3. Email it to the customer with the PDF attached
  const sendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_KEY}`
    },
    body: JSON.stringify({
      from: 'Book Ted <bookings@bookted.uk>',
      to: email,
      subject: 'BOOK TED — Payment Received',
      html: paymentReceivedHtml({ location, slotTime }),
      attachments: [{
        filename: `Book-Ted-Invoice-${(id || '').slice(0, 8)}.pdf`,
        content: base64Pdf
      }]
    })
  });

  if (!sendRes.ok) {
    const body = await sendRes.text();
    return new Response(JSON.stringify({ error: 'email send failed', detail: body }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
