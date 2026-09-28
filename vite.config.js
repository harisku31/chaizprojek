import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || '';

  return {
    plugins: [
      react(),
      {
        name: 'local-api-chat-middleware',
        configureServer(server) {
          server.middlewares.use('/api/chat', async (req, res) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', (chunk) => {
                body += chunk;
              });
              req.on('end', async () => {
                try {
                  const { contents, systemInstruction, generationConfig } = JSON.parse(body || '{}');
                  const models = [
                    'gemini-3.6-flash',
                    'gemini-3.7-flash',
                    'gemini-flash-latest',
                    'gemini-3.8-flash',
                    'gemini-flash-lite-latest'
                  ];

                  const payload = {
                    contents,
                    systemInstruction,
                    generationConfig: generationConfig || { temperature: 0.75, maxOutputTokens: 1000 }
                  };

                  let reply = null;
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
                        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
                          reply = data.candidates[0].content.parts.map((p) => p.text).join('');
                          break;
                        }
                      }
                    } catch (e) {
                      console.warn(`[Local Dev] Model ${model} failed:`, e.message);
                    }
                  }

                  if (reply) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ reply }));
                  } else {
                    res.writeHead(502, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Semua model AI sedang sibuk.' }));
                  }
                } catch (err) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
            } else {
              res.writeHead(405, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
            }
          });
        }
      }
    ],
    server: {
      port: 3000,
      host: true,
      open: false
    }
  };
});
