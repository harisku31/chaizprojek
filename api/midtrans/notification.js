// Vercel Serverless Function: Midtrans Webhook Notification
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
    const notif = req.body || {};
    const orderId = notif.order_id;
    const status = notif.transaction_status;
    const fraudStatus = notif.fraud_status;

    let isPaid = false;
    if (status === 'capture') {
      if (fraudStatus === 'accept') isPaid = true;
    } else if (status === 'settlement') {
      isPaid = true;
    }

    console.log(`[Midtrans Vercel Webhook]: Order ${orderId} -> Status: ${status}, isPaid: ${isPaid}`);

    // If Firebase RTDB is configured, we can also update Firebase directly from Vercel
    const FIREBASE_DB_URL = 'https://chaizstore-default-rtdb.asia-southeast1.firebasedatabase.app';
    if (orderId && isPaid) {
      try {
        await fetch(`${FIREBASE_DB_URL}/transactions/${orderId}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'Diproses',
            paymentStatus: 'Lunas',
            paymentMethod: `Midtrans (${notif.payment_type || 'QRIS'})`,
            midtransStatus: status,
            settlementTime: notif.settlement_time || new Date().toISOString()
          })
        });
      } catch (fbErr) {
        console.warn('Firebase patch warning:', fbErr.message);
      }
    }

    return res.status(200).json({ status: 'OK', orderId, isPaid });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
