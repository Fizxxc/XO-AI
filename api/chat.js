// api/chat.js  (Edge Runtime = true untuk latency rendah)
export const config = { runtime: 'edge' };       // ⬅️ Vercel Edge Function

export default async function handler(req) {
  if (req.method !== 'POST')
    return new Response(JSON.stringify({ error: 'Gunakan POST' }), { status: 405 });

  const { prompt } = await req.json();
  if (!prompt)
    return new Response(JSON.stringify({ error: 'Prompt kosong' }), { status: 400 });

  const body = {
    model: 'gpt-4o-mini',           // ← model lebih baru & murah
    messages: [
      { role: 'system', content: 'You are XO AI, a helpful Indonesian assistant.' },
      { role: 'user',   content: prompt }
    ],
    temperature: 0.55
  };

  const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_KEY}`   // 🔒 aman via env-var
    },
    body: JSON.stringify(body)
  });

  const data = await openaiRes.json();
  if (!openaiRes.ok)
    return new Response(JSON.stringify({ error: data.error?.message || 'Error OpenAI' }),
                        { status: openaiRes.status });

  const answer = data.choices?.[0]?.message?.content?.trim() || 'Maaf, terjadi kesalahan.';
  return new Response(JSON.stringify({ answer }), { headers: { 'Content-Type': 'application/json' } });
}
