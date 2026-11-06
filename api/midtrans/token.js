// Vercel Serverless Function: Create Midtrans Snap Token
export default async function handler(req, res) {
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
    const { orderId, amount, customerName, customerEmail, customerPhone, items } = req.body || {};

    if (!orderId || !amount) {
      return res.status(400).json({ error: 'orderId and amount are required' });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    if (!serverKey) {
      return res.status(500).json({ error: 'MIDTRANS_SERVER_KEY is not configured in environment variables' });
    }
    const authHeader = 'Basic ' + Buffer.from(`${serverKey}:`).toString('base64');

    const payload = {
      transaction_details: {
        order_id: String(orderId),
        gross_amount: Math.round(Number(amount))
      },
      customer_details: {
        first_name: customerName || 'Pelanggan ChaizStore',
        email: customerEmail && customerEmail.includes('@') ? customerEmail : 'order@chaizstore.my.id',
        phone: customerPhone || '081234567890'
      }
    };

    if (items && Array.isArray(items) && items.length > 0) {
      payload.item_details = items.map((it, idx) => ({
        id: String(it.productId || it.id || `item-${idx + 1}`).slice(0, 50),
        price: Math.round(Number(it.price || it.total || amount)),
        quantity: Number(it.qty || 1),
        name: String(it.name || 'Produk Digital').slice(0, 50)
      }));
    }

    const response = await fetch('https://app.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error_messages || data.message || 'Midtrans error', details: data });
    }

    return res.status(200).json({
      success: true,
      token: data.token,
      redirect_url: data.redirect_url,
      clientKey: process.env.MIDTRANS_CLIENT_KEY || ''
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
