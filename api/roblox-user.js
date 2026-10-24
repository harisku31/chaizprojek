import https from 'https';

function httpsRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => {
      req.destroy(new Error('Request timeout'));
    });
    if (postData) req.write(postData);
    req.end();
  });
}

function sendResponse(res, statusCode, body) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(body);
  }
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader?.('Access-Control-Allow-Credentials', 'true');
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader?.(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') return res.status(200).end();
    res.writeHead(200);
    return res.end();
  }

  let username = '';
  if (req.method === 'GET') {
    const parsedUrl = new URL(req.url, 'http://localhost:3000');
    username = (parsedUrl.searchParams.get('username') || req.query?.username || '').trim();
  } else if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    username = (body?.username || '').trim();
  } else {
    return sendResponse(res, 405, { error: 'Method Not Allowed' });
  }

  // Strip leading '@' if user typed it
  if (username.startsWith('@')) {
    username = username.substring(1).trim();
  }

  if (!username || username.length < 3) {
    return sendResponse(res, 400, {
      success: false,
      error: 'Username Roblox minimal 3 karakter'
    });
  }

  try {
    const postBody = JSON.stringify({
      usernames: [username],
      excludeBannedUsers: false
    });

    const userRes = await httpsRequest(
      {
        hostname: 'users.roblox.com',
        port: 443,
        path: '/v1/usernames/users',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postBody),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      },
      postBody
    );

    if (!userRes.data || !userRes.data.data || userRes.data.data.length === 0) {
      return sendResponse(res, 200, {
        success: true,
        found: false,
        message: `Akun Roblox "${username}" tidak ditemukan.`
      });
    }

    const u = userRes.data.data[0];

    // Fetch Avatar Headshot & Full Avatar in parallel
    const [thumbRes, fullRes] = await Promise.all([
      httpsRequest({
        hostname: 'thumbnails.roblox.com',
        port: 443,
        path: `/v1/users/avatar-headshot?userIds=${u.id}&size=150x150&format=Png&isCircular=false`,
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }).catch(() => null),
      httpsRequest({
        hostname: 'thumbnails.roblox.com',
        port: 443,
        path: `/v1/users/avatar?userIds=${u.id}&size=150x150&format=Png&isCircular=false`,
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }).catch(() => null)
    ]);

    const avatarUrl = thumbRes?.data?.data?.[0]?.imageUrl || '';
    const avatarFullUrl = fullRes?.data?.data?.[0]?.imageUrl || '';

    return sendResponse(res, 200, {
      success: true,
      found: true,
      user: {
        id: u.id,
        name: u.name,
        displayName: u.displayName,
        hasVerifiedBadge: Boolean(u.hasVerifiedBadge),
        avatarUrl,
        avatarFullUrl
      }
    });
  } catch (error) {
    console.error('Roblox API Error:', error);
    return sendResponse(res, 500, {
      success: false,
      error: 'Gagal menghubungi server Roblox: ' + error.message
    });
  }
}
