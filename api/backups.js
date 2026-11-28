const FIREBASE_DB_URL = 'https://chaizstore-default-rtdb.asia-southeast1.firebasedatabase.app';

function sendJson(res, statusCode, data) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(data);
  }
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body);
    }
    if (typeof req.body === 'string') {
      try {
        return resolve(JSON.parse(req.body));
      } catch {
        return resolve({});
      }
    }
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}

export default async function handler(req, res) {
  res.setHeader?.('Access-Control-Allow-Credentials', 'true');
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader?.(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') return res.status(200).end();
    res.writeHead(200);
    return res.end();
  }

  try {
    const url = new URL(req.url, 'http://localhost');
    const pathParts = url.pathname.split('/').filter(Boolean);
    const idParam = pathParts[2] || url.searchParams.get('id') || '';

    if (req.method === 'GET') {
      if (idParam) {
        const fbRes = await fetch(`${FIREBASE_DB_URL}/backups/${encodeURIComponent(idParam)}.json?ts=${Date.now()}`);
        if (!fbRes.ok) return sendJson(res, 404, { success: false, error: 'Backup not found' });
        const item = await fbRes.json();
        return sendJson(res, 200, { success: true, data: item });
      }
      const fbRes = await fetch(`${FIREBASE_DB_URL}/backups.json?ts=${Date.now()}`);
      if (!fbRes.ok) return sendJson(res, 200, { success: true, count: 0, data: [] });
      const data = await fbRes.json();
      const list = data ? (Array.isArray(data) ? data.filter(Boolean) : Object.values(data).filter(Boolean)) : [];
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return sendJson(res, 200, { success: true, count: list.length, data: list });
    }

    if (req.method === 'POST') {
      const body = await parseBody(req);
      const id = body.id || `BKP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const record = { ...body, id, createdAt: body.createdAt || new Date().toISOString() };
      await fetch(`${FIREBASE_DB_URL}/backups/${encodeURIComponent(id)}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      return sendJson(res, 201, { success: true, data: record });
    }

    if (req.method === 'DELETE' && idParam) {
      await fetch(`${FIREBASE_DB_URL}/backups/${encodeURIComponent(idParam)}.json`, { method: 'DELETE' });
      return sendJson(res, 200, { success: true });
    }

    return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
  } catch (err) {
    return sendJson(res, 500, { success: false, error: err.message });
  }
}
