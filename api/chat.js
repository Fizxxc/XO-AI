export const config = { runtime: 'edge' };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_TABLE = 'chat_logs'; // sesuaikan nama tabelmu

async function supabaseInsert(data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation' // Supabase agar mengembalikan row yg baru dimasukkan
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Supabase insert error: ${JSON.stringify(errorData)}`);
  }

  return await res.json();
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Gunakan POST' }), { status: 405 });
  }

  const contentType = req.headers.get('content-type') || '';

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

    // Simpan prompt dan jawaban ke Supabase via REST API
    try {
      await supabaseInsert({ prompt, answer, created_at: new Date().toISOString() });
    } catch (error) {
      console.error(error);
      // Bisa tetap lanjutkan jika error insert ke DB, tapi beri tahu user
      return new Response(
        JSON.stringify({ answer, warning: 'Gagal menyimpan chat ke database.' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ answer }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (contentType.includes('multipart/form-data')) {
    return new Response(
      JSON.stringify({ error: 'Gunakan frontend untuk upload via Supabase langsung (signed URL)' }),
      { status: 400 }
    );
  }

  return new Response(JSON.stringify({ error: 'Format request tidak dikenali' }), { status: 400 });
}
