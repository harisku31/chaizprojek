export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { contents, systemInstruction, generationConfig } = req.body || {};

    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ error: 'Bad Request: "contents" is required' });
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      "";

    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in Vercel environment variables.'
      });
    }

    // Stable & high-speed Gemini models with fallback
    const models = [
      "gemini-flash-lite-latest",
      "gemini-3.6-flash",
      "gemini-3.8-flash",
      "gemini-flash-latest"
    ];

    const payload = {
      contents,
      systemInstruction: systemInstruction || undefined,
      generationConfig: generationConfig || {
        temperature: 0.7,
        maxOutputTokens: 1000
      }
    };

    let replyText = null;
    let lastError = null;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          if (
            data.candidates &&
            data.candidates[0] &&
            data.candidates[0].content &&
            data.candidates[0].content.parts
          ) {
            replyText = data.candidates[0].content.parts.map((p) => p.text).join('');
            return res.status(200).json({ reply: replyText });
          }
        } else {
          const errData = await response.text();
          lastError = `[${model}] HTTP ${response.status}: ${errData}`;
        }
      } catch (err) {
        lastError = `[${model}] ${err.message}`;
      }
    }

    return res.status(502).json({
      error: 'Semua model AI sedang sibuk atau tidak merespons.',
      details: lastError
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
