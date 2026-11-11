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
  res.setHeader?.('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,PATCH,DELETE');
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
    // e.g. /api/transactions/user/:userKey or /api/transactions/:id
    let userKeyParam = url.searchParams.get('userKey');
    let orderIdParam = url.searchParams.get('id');

    if (pathParts[2] === 'user' && pathParts[3]) {
      userKeyParam = pathParts[3];
    } else if (pathParts[2] && pathParts[2] !== 'user') {
      orderIdParam = pathParts[2];
    }

    // 1. GET: Ambil Transaksi
    if (req.method === 'GET') {
      if (userKeyParam) {
        const cleanKey = encodeURIComponent(userKeyParam.toLowerCase().trim());
        const fbRes = await fetch(`${FIREBASE_DB_URL}/user_transactions/${cleanKey}.json?ts=${Date.now()}`);
        if (!fbRes.ok) {
          return sendJson(res, 200, { success: true, count: 0, data: [] });
        }
        const data = await fbRes.json();
        const list = data ? (Array.isArray(data) ? data.filter(Boolean) : Object.values(data).filter(Boolean)) : [];
        return sendJson(res, 200, { success: true, count: list.length, data: list });
      }

      const fbRes = await fetch(`${FIREBASE_DB_URL}/transactions.json?ts=${Date.now()}`);
      if (!fbRes.ok) {
        return sendJson(res, 200, { success: true, count: 0, data: [] });
      }
      const data = await fbRes.json();
      const list = data ? (Array.isArray(data) ? data.filter(Boolean) : Object.values(data).filter(Boolean)) : [];
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return sendJson(res, 200, { success: true, count: list.length, data: list });
    }

    // 2. POST: Buat Pesanan Baru
    if (req.method === 'POST') {
      const body = await parseBody(req);
      if (!body || (!body.productName && !body.id)) {
        return sendJson(res, 400, { success: false, error: 'Invalid transaction data' });
      }

      const id = body.id || `TRX-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const trxData = {
        ...body,
        id,
        createdAt: body.createdAt || new Date().toISOString(),
        status: body.status || 'processing'
      };

      // Simpan ke node root transaksi Firebase
      await fetch(`${FIREBASE_DB_URL}/transactions/${id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trxData)
      });

      // Simpan ke node user privat jika ada
      const uKey = trxData.userKey || trxData.userId;
      if (uKey) {
        const cleanKey = encodeURIComponent(String(uKey).toLowerCase().trim());
        await fetch(`${FIREBASE_DB_URL}/user_transactions/${cleanKey}/${id}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(trxData)
        });
      }

      return sendJson(res, 201, { success: true, data: trxData });
    }

    // 3. PATCH / PUT: Update Transaksi
    if (req.method === 'PATCH' || req.method === 'PUT') {
      const body = await parseBody(req);
      const id = orderIdParam || body.id;
      if (!id) {
        return sendJson(res, 400, { success: false, error: 'Transaction ID is required' });
      }

      const patchData = {
        ...body,
        updatedAt: new Date().toISOString()
      };

      await fetch(`${FIREBASE_DB_URL}/transactions/${id}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchData)
      });

      const uKey = patchData.userKey || patchData.userId;
      if (uKey) {
        const cleanKey = encodeURIComponent(String(uKey).toLowerCase().trim());
        await fetch(`${FIREBASE_DB_URL}/user_transactions/${cleanKey}/${id}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patchData)
        });
      }

      return sendJson(res, 200, { success: true, data: patchData });
    }

    // 4. DELETE: Hapus Transaksi
    if (req.method === 'DELETE') {
      const id = orderIdParam;
      if (!id) {
        return sendJson(res, 400, { success: false, error: 'Transaction ID is required' });
      }

      await fetch(`${FIREBASE_DB_URL}/transactions/${id}.json`, {
        method: 'DELETE'
      });

      return sendJson(res, 200, { success: true, message: 'Transaction deleted' });
    }

    return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
  } catch (err) {
    return sendJson(res, 500, { success: false, error: err.message });
  }
}
