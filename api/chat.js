import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Gunakan POST' }), { status: 405 });
  }

  const contentType = req.headers.get('content-type') || '';

  // Jika JSON biasa (chat tanpa file)
  if (contentType.includes('application/json')) {
    const { prompt } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt kosong' }), { status: 400 });
    }

    const body = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are XO AI, a helpful Indonesian assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.55
    };

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_KEY}`,
        'OpenAI-Project': process.env.OPENAI_PROJECT_ID
      },
      body: JSON.stringify(body)
    });

    const data = await openaiRes.json();
    if (!openaiRes.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'Error OpenAI' }), {
        status: openaiRes.status,
      });
    }

    const answer = data.choices?.[0]?.message?.content?.trim() || 'Maaf, terjadi kesalahan.';
    return new Response(JSON.stringify({ answer }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Jika menerima multipart/form-data (untuk file upload)
  if (contentType.includes('multipart/form-data')) {
    return new Response(JSON.stringify({ error: 'Gunakan frontend untuk upload via Supabase langsung (signed URL)' }), {
      status: 400
    });
  }

  return new Response(JSON.stringify({ error: 'Format request tidak dikenali' }), { status: 400 });
}
