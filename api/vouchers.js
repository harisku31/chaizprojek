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

async function loadFirebaseVouchers() {
  const fbRes = await fetch(`${FIREBASE_DB_URL}/vouchers.json?ts=${Date.now()}`);
  if (!fbRes.ok) return [];
  const data = await fbRes.json();
  if (!data) return [];
  const list = Array.isArray(data) ? data.filter(Boolean) : Object.values(data).filter(Boolean);
  list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  return list;
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
    const subSegment = pathParts[2] || '';
    const subAction = pathParts[3] || '';

    if (req.method === 'GET') {
      const list = await loadFirebaseVouchers();
      if (subSegment === 'check' && subAction) {
        const clean = decodeURIComponent(subAction).trim().toUpperCase().replace(/\s+/g, '');
        const found = list.find((v) => v.code === clean || v.id === subAction);
        if (!found) return sendJson(res, 404, { success: false, reason: 'NOT_FOUND' });
        return sendJson(res, 200, { success: true, data: found });
      }
      return sendJson(res, 200, { success: true, count: list.length, data: list });
    }

    if (req.method === 'POST') {
      const body = await parseBody(req);

      // Use / burn voucher
      if (subSegment === 'use' || subAction === 'use') {
        const codeOrId = body.code || body.id || (subAction === 'use' ? subSegment : '');
        const clean = String(codeOrId || '').trim().toUpperCase().replace(/\s+/g, '');
        const list = await loadFirebaseVouchers();
        const found = list.find((v) => v.code === clean || v.id === codeOrId);
        if (!found) return sendJson(res, 404, { success: false, reason: 'NOT_FOUND' });
        if (found.isUsed) return sendJson(res, 409, { success: false, reason: 'ALREADY_USED', data: found });
        if (found.isActive === false) return sendJson(res, 409, { success: false, reason: 'INACTIVE', data: found });

        const patch = {
          isUsed: true,
          isActive: false,
          usedAt: new Date().toISOString(),
          usedBy: body.usedBy || body.userEmail || 'Pelanggan',
          usedOrder: body.usedOrder || body.orderId || '',
          updatedAt: new Date().toISOString()
        };
        await fetch(`${FIREBASE_DB_URL}/vouchers/${encodeURIComponent(found.id)}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch)
        });
        return sendJson(res, 200, { success: true, data: { ...found, ...patch } });
      }

      // Create / save voucher
      if (!body || !body.code) {
        return sendJson(res, 400, { success: false, error: 'Kode voucher wajib diisi' });
      }
      const id = body.id || `vch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const voucherData = { ...body, id, updatedAt: new Date().toISOString() };
      await fetch(`${FIREBASE_DB_URL}/vouchers/${encodeURIComponent(id)}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voucherData)
      });
      return sendJson(res, 201, { success: true, data: voucherData });
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      const body = await parseBody(req);
      const targetId = subSegment || body.id;
      if (!targetId) return sendJson(res, 400, { success: false, error: 'Voucher ID is required' });

      if (subAction === 'toggle') {
        const list = await loadFirebaseVouchers();
        const found = list.find((v) => v.id === targetId || v.code === targetId);
        if (!found) return sendJson(res, 404, { success: false, error: 'Voucher not found' });
        if (found.isUsed) return sendJson(res, 200, { success: true, data: found });
        const patch = { isActive: !found.isActive, updatedAt: new Date().toISOString() };
        await fetch(`${FIREBASE_DB_URL}/vouchers/${encodeURIComponent(found.id)}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch)
        });
        return sendJson(res, 200, { success: true, data: { ...found, ...patch } });
      }

      const patch = { ...body, updatedAt: new Date().toISOString() };
      await fetch(`${FIREBASE_DB_URL}/vouchers/${encodeURIComponent(targetId)}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      });
      return sendJson(res, 200, { success: true, data: patch });
    }

    if (req.method === 'DELETE') {
      if (subSegment === 'used' && subAction === 'clear') {
        const list = await loadFirebaseVouchers();
        const used = list.filter((v) => v.isUsed);
        await Promise.all(
          used.map((v) =>
            fetch(`${FIREBASE_DB_URL}/vouchers/${encodeURIComponent(v.id)}.json`, { method: 'DELETE' })
          )
        );
        return sendJson(res, 200, { success: true, clearedCount: used.length });
      }
      if (subSegment) {
        await fetch(`${FIREBASE_DB_URL}/vouchers/${encodeURIComponent(subSegment)}.json`, { method: 'DELETE' });
        return sendJson(res, 200, { success: true });
      }
      return sendJson(res, 400, { success: false, error: 'Voucher ID is required' });
    }

    return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
  } catch (err) {
    return sendJson(res, 500, { success: false, error: err.message });
  }
}
