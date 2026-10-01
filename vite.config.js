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
          server.middlewares.use((req, res, next) => {
            const parsedUrl = new URL(req.url, 'http://localhost:3000');
            const isChatRoute = parsedUrl.pathname === '/api/chat';
            if (isChatRoute && req.method === 'POST') {
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
                    'gemini-3.5-flash-lite',
                    'gemini-flash-latest',
                    'gemini-3.8-flash',
                    'gemini-flash-lite-latest',
                    'gemma-4-31b-it',
                    'gemma-4-26b-a4b-it'
                  ];

                  const payload = {
                    contents,
                    systemInstruction,
                    generationConfig: generationConfig || { temperature: 0.75, maxOutputTokens: 1000 }
                  };

                  let reply = null;
                  for (const model of models) {
                    try {
                      const isGemma = model.startsWith('gemma');
                      let requestContents = contents;
                      let requestSys = systemInstruction;

                      if (isGemma && systemInstruction) {
                        requestSys = undefined;
                        const sysText =
                          typeof systemInstruction === 'string'
                            ? systemInstruction
                            : systemInstruction.parts?.[0]?.text || '';
                        if (sysText) {
                          const firstParts = contents[0]?.parts || [];
                          const firstText = firstParts.map((p) => p.text || '').join('\n');
                          requestContents = [
                            {
                              role: 'user',
                              parts: [{ text: `[Instruksi Sistem & Konteks:\n${sysText}]\n\n${firstText}` }]
                            },
                            ...contents.slice(1)
                          ];
                        }
                      }

                      const modelPayload = {
                        contents: requestContents,
                        systemInstruction: requestSys || undefined,
                        generationConfig: generationConfig || { temperature: 0.75, maxOutputTokens: 1000 }
                      };

                      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                      const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(modelPayload),
                        signal: AbortSignal.timeout(5000)
                      });

                      if (response.ok) {
                        const data = await response.json();
                        const candidate = data.candidates?.[0];
                        if (candidate && candidate.content && candidate.content.parts) {
                          const parts = candidate.content.parts;
                          let cleanText = '';
                          for (const part of parts) {
                            if (!part.thought && part.text) {
                              cleanText += (cleanText ? '\n' : '') + part.text;
                            }
                          }
                          if (!cleanText && parts[0]?.text) {
                            cleanText = parts[0].text;
                          }
                          if (cleanText) {
                            reply = cleanText.trim();
                            break;
                          }
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
            } else if (isChatRoute) {
              res.writeHead(405, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
            } else {
              next();
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
