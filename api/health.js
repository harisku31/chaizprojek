export default function handler(req, res) {
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') return res.status(200).end();
    res.writeHead(200);
    return res.end();
  }

  const responseData = {
    status: 'ok',
    server: 'ChaizStore Cloud Edge (Vercel)',
    timestamp: new Date().toISOString()
  };

  if (typeof res.status === 'function') {
    return res.status(200).json(responseData);
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(responseData));
}
