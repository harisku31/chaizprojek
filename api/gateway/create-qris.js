const JANSPAYMENT_BASE_URL = 'https://janspayment.com';
const JANSPAYMENT_API_KEY = process.env.JANSPAYMENT_API_KEY || 'js_c2ae56533ce1a2da9470e1e5916bd8cc67c732718d7b9c43';

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
    if (req.body && typeof req.body === 'object') return resolve(req.body);
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
  res.setHeader?.('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') return res.status(200).end();
    res.writeHead(200);
    return res.end();
  }

  try {
    const body = await parseBody(req);
    const { orderId, amount, customerName, note } = body || {};
    if (!orderId || !amount) {
      return sendJson(res, 400, { success: false, error: 'orderId and amount are required' });
    }

    const cleanAmount = Math.max(1000, Math.round(Number(amount)));

    const jansRes = await fetch(`${JANSPAYMENT_BASE_URL}/gateaway/qris/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JANSPAYMENT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: cleanAmount,
        ref: orderId,
        note: note || `Pesanan #${orderId} ${customerName || 'ChaizStore'}`
      })
    });

    const data = await jansRes.json();
    return sendJson(res, jansRes.status, data);
  } catch (err) {
    return sendJson(res, 500, { success: false, error: err.message });
  }
}
