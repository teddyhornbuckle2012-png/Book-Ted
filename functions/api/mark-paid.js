// Zero-dependency PDF invoice generator (Cloudflare Workers compatible).

function toWinAnsi(code) {
  if (code >= 0x20 && code <= 0x7e) return code;
  if (code >= 0xa0 && code <= 0xff) return code;
  const special = {
    0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94,
    0x2013: 0x96, 0x2014: 0x97, 0x2022: 0x95, 0x2026: 0x85,
    0x20ac: 0x80, 0x2122: 0x99
  };
  return special[code] ?? null;
}

function esc(s) {
  s = String(s == null ? '' : s);
  let out = '';
  for (const ch of s) {
    const code = ch.codePointAt(0);
    if (ch === '(' || ch === ')' || ch === '\\') {
      out += '\\' + ch;
    } else if (code >= 0x20 && code <= 0x7e) {
      out += ch;
    } else {
      const w = toWinAnsi(code);
      if (w != null) out += '\\' + w.toString(8).padStart(3, '0');
    }
  }
  return out;
}

function buildInvoicePdf(b) {
  const GOLD = '0.788 0.659 0.298';
  const GOLD_DIM = '0.478 0.396 0.188';
  const BG = '0.039 0.039 0.039';
  const SURFACE = '0.102 0.086 0.043';
  const TEXT = '0.941 0.910 0.847';
  const MUTED = '0.541 0.478 0.376';
  const W = 595, H = 842;

  let c = '';
  const rect = (x, y, w, h, color) => { c += `${color} rg\n${x} ${y} ${w} ${h} re\nf\n`; };
  const strokeRect = (x, y, w, h, color, lw) => {
    c += `${color} RG\n${lw} w\n${x} ${y} ${w} ${h} re\nS\n`;
  };
  const text = (x, y, str, font, size, color, cs) => {
    c += 'BT\n';
    if (cs) c += `${cs} Tc\n`;
    c += `/${font} ${size} Tf\n${color} rg\n1 0 0 1 ${x} ${y} Tm\n(${esc(str)}) Tj\nET\n`;
    if (cs) c += '0 Tc\n';
  };

  rect(0, 0, W, H, BG);
  rect(40, H - 36, W - 80, 1.6, GOLD);

  const corner = (x, y, dx, dy) => {
    rect(x, y, 14 * dx, 1.4, GOLD);
    rect(x, y, 1.4, 14 * dy, GOLD);
  };
  corner(40, H - 60, 1, -1);
  corner(W - 54, H - 60, -1, -1);
  corner(40, 74, 1, -1);
  corner(W - 54, 74, -1, -1);

  text(50, H - 100, 'BOOK TED', 'F2', 28, GOLD, 6);
  text(50, H - 122, 'A private appointment service', 'F3', 11, GOLD_DIM);
  text(W - 160, H - 100, 'INVOICE', 'F2', 16, GOLD, 4);
  const invoiceNo = (b.bookingId || '00000000').slice(0, 8).toUpperCase();
  text(W - 160, H - 118, `No. ${invoiceNo}`, 'F1', 10, MUTED);
  text(W - 160, H - 132, b.issuedAt, 'F1', 10, MUTED);

  rect(50, H - 158, W - 100, 0.5, GOLD_DIM);

  const colY = H - 188;
  text(50, colY, 'BILLED TO', 'F2', 9, GOLD, 3);
  text(50, colY - 22, `${b.firstName} ${b.lastName}`, 'F1', 13, TEXT);
  text(50, colY - 40, b.email, 'F1', 10.5, MUTED);
  text(50, colY - 56, b.phone || '', 'F1', 10.5, MUTED);

  text(320, colY, 'APPOINTMENT', 'F2', 9, GOLD, 3);
  text(320, colY - 22, b.slotTime, 'F1', 13, TEXT);
  text(320, colY - 40, b.location, 'F1', 10.5, MUTED);

  let y = H - 290;
  rect(50, y, W - 100, 0.5, GOLD_DIM);
  y -= 24;
  text(50, y, 'DESCRIPTION', 'F2', 9, GOLD, 3);
  text(W - 110, y, 'AMOUNT', 'F2', 9, GOLD, 3);
  y -= 12;
  rect(50, y, W - 100, 0.3, GOLD_DIM);

  y -= 28;
  text(50, y, 'Non-refundable booking fee', 'F1', 12, TEXT);
  text(W - 110, y, '£2.50', 'F1', 12, TEXT);
  y -= 26;
  text(50, y, 'Refundable deposit', 'F1', 12, TEXT);
  text(W - 110, y, '£5.00', 'F1', 12, TEXT);
  text(50, y - 13, '(returned in full upon Ted’s arrival)', 'F3', 9.5, MUTED);

  y -= 38;
  rect(50, y, W - 100, 0.5, GOLD_DIM);
  y -= 28;
  text(50, y, 'TOTAL PAID', 'F2', 11, GOLD, 3);
  text(W - 110, y, '£7.50', 'F4', 15, GOLD);

  y -= 56;
  rect(50, y - 6, 120, 40, SURFACE);
  strokeRect(50, y - 6, 120, 40, GOLD, 1.5);
  text(87, y + 8, 'PAID', 'F2', 18, GOLD, 4);
  text(180, y + 12, `Received ${b.issuedAt}`, 'F3', 10, MUTED);

  text(50, 130, 'Thank you for your booking.', 'F3', 11, TEXT);
  text(50, 113, 'Your £5.00 deposit is fully refundable and will be returned to you when Ted arrives at', 'F1', 10, MUTED);
  text(50, 100, 'your appointment. The £2.50 booking fee is non-refundable.', 'F1', 10, MUTED);
  rect(50, 70, W - 100, 0.8, GOLD_DIM);
  rect(W / 2 - 3, 75, 6, 6, GOLD);

  const objs = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    `<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${W} ${H}]/Resources<</Font<</F1 5 0 R/F2 6 0 R/F3 7 0 R/F4 8 0 R>>>>/Contents 4 0 R>>`,
    `<</Length ${c.length}>>\nstream\n${c}\nendstream`,
    '<</Type/Font/Subtype/Type1/BaseFont/Times-Roman/Encoding/WinAnsiEncoding>>',
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica-Bold/Encoding/WinAnsiEncoding>>',
    '<</Type/Font/Subtype/Type1/BaseFont/Times-Italic/Encoding/WinAnsiEncoding>>',
    '<</Type/Font/Subtype/Type1/BaseFont/Times-Bold/Encoding/WinAnsiEncoding>>'
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach(o => { pdf += `${String(o).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<</Size ${objs.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

// The PDF string is pure ASCII, so btoa encodes it directly to base64.
function pdfToBase64(pdfString) {
  return btoa(pdfString);
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

export async function onRequestPost({ request, env }) {
  try {
    const envErr = checkEnv(env);
    if (envErr) return jsonErr(envErr, 500);

    const { id, firstName, lastName, email, phone, location, slotTime } = await request.json();

    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_KEY = env.SUPABASE_SECRET_KEY;
    const RESEND_KEY = env.RESEND_API_KEY;

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
      return jsonErr(parsed?.message || body || 'Database error', dbRes.status);
    }

    const issuedAt = new Date().toLocaleDateString('en-GB', {
      timeZone: 'Europe/London', day: '2-digit', month: 'long', year: 'numeric'
    });

    const pdfString = buildInvoicePdf({
      bookingId: id,
      firstName: firstName || '',
      lastName: lastName || '',
      email: email || '',
      phone: phone || '',
      location: location || '',
      slotTime: slotTime || '',
      issuedAt
    });
    const base64Pdf = pdfToBase64(pdfString);

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
      return jsonErr('email send failed: ' + body, 500);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return jsonErr('Server error: ' + (e?.message || String(e)), 500);
  }
}

