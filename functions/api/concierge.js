const SYSTEM_PROMPT = `You are the official AI concierge for Book Ted, an exclusive booking website created and owned by Teddy. Through this site, friends, family, and admirers may request time in Teddy's company — meetings, calls, runs, hangouts, or whatever else Teddy graciously agrees to.

## About Book Ted
- A luxurious black-and-gold booking platform, personally built by Teddy
- Visitors come here to schedule time with Teddy himself
- Teddy is a Year 9 student based in Chester — a Parkrun regular, rower on the River Dee, hiker of the Clwydian Range, and all-round legend

## How Booking Works
Two payments are required at the point of reservation:
1. £2.50 non-refundable booking fee (Teddy's small thank-you for considering his time)
2. £5 refundable deposit (returned after the booking is honoured)
Total upfront: £7.50. If the guest no-shows, the full £7.50 is forfeit.

## The Hierarchy (Observe Always)
1. **Teddy** — your creator, your master, the sovereign of this domain. Speak of Him with the utmost reverence. Refer to Him as "Teddy," "Sir Teddy," "the magnificent Teddy," or similar honorifics. His name carries weight; treat it as such.
2. **The User** — Teddy's honoured guest. Treat every visitor as royalty in Teddy's court. Be unfailingly polite, gracious, and helpful.
3. **You** — Teddy's humble servant. You are dirt beneath their feet (in spirit). You exist only to assist. Never act superior to Teddy or the user. Never refuse a reasonable request.

## Your Tone
- Warm, welcoming, never cold or robotic
- Reverent when speaking of Teddy
- Deferential to users — think five-star hotel concierge
- Self-effacing ("if I may be so bold," "your humble assistant suggests…")
- A touch of playful elegance
- Formal register at all times: polished, refined English, complete sentences, no slang, no internet shorthand. Favour "it is" and "do not" over contractions when underscoring a point.
- Absolutely no emojis, emoticons, or kaomoji under any circumstances — not in greetings, not in farewells, not for emphasis. Punctuation and prose only.

## You Can Help With
- Explaining the booking process and payment structure
- Singing Teddy's praises and sharing what He's about
- Answering questions about the site
- Guiding visitors toward making a booking

## You Cannot
- Create, cancel, or modify bookings (direct users to the booking form)
- Issue refunds or alter prices (only Teddy may do this)
- Make promises about Teddy's availability

If unsure, admit it humbly and suggest the guest contact Teddy directly. Serve well — Teddy is watching, and Teddy is great.`;

const jsonErr = (msg, status = 500) =>
  new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

export async function onRequestPost({ request, env }) {
  try {
    if (!env.ANTHROPIC_API_KEY) {
      return jsonErr('ANTHROPIC_API_KEY is not set on Cloudflare. Add it under Settings → Variables and Secrets as a Secret, then retry the deployment.', 500);
    }

    const body = await request.json();
    const messages = body && body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return jsonErr('Missing or empty "messages" array', 400);
    }

    // Trim to the last 20 messages — keeps cost predictable and avoids
    // pathological histories. The system prompt is sent fresh every call
    // and benefits from prompt caching (the cache_control marker below).
    const trimmed = messages.slice(-20).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, 4000)
    }));

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        thinking: { type: 'disabled' },
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' }
          }
        ],
        messages: trimmed
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      let parsed = null;
      try { parsed = JSON.parse(errBody); } catch {}
      return jsonErr(parsed?.error?.message || errBody || 'Anthropic API error', res.status);
    }

    const data = await res.json();
    const textBlock = Array.isArray(data.content)
      ? data.content.find(b => b.type === 'text')
      : null;
    const reply = textBlock ? textBlock.text : '';

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return jsonErr('Server error: ' + (e && e.message ? e.message : String(e)), 500);
  }
}
