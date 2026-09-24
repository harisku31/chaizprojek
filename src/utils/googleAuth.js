/**
 * Google Identity Services (OAuth 2.0 / GIS) Authentication Utility
 * Mendukung autentikasi resmi Google (Popup, GIS Token Client, dan Google Sign-In Button)
 */

export const STORAGE_KEY_CLIENT_ID = 'chaiz_google_client_id';

// Client ID Khusus Production / Vercel (chaizstore-web-taupe.vercel.app)
export const VERCEL_PRODUCTION_CLIENT_ID = '1996629502-7v3pu0ncflcjitrtn5m88bjanb05rtik.apps.googleusercontent.com';

// Client ID Khusus Localhost Dev (localhost)
export const LOCALHOST_DEV_CLIENT_ID = '1996629502-u9c5l3ci3ufeqp36ttmucuqhtue1pqir.apps.googleusercontent.com';

export const DEFAULT_OFFICIAL_CLIENT_ID = VERCEL_PRODUCTION_CLIENT_ID;

/**
 * Decode base64 Google JWT Token
 */
export function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Gagal membaca JWT Google:', e);
    return null;
  }
}

/**
 * Mengambil Google Client ID dari env, localStorage, atau deteksi otomatis domain
 */
export function getActiveGoogleClientId() {
  const envId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (envId && envId.trim()) return envId.trim();

  const localId = localStorage.getItem(STORAGE_KEY_CLIENT_ID);
  if (localId && localId.trim()) return localId.trim();

  // Otomatis tentukan berdasarkan domain (Localhost vs Vercel)
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      return LOCALHOST_DEV_CLIENT_ID;
    }
  }

  return VERCEL_PRODUCTION_CLIENT_ID;
}

/**
 * Menyimpan Google Client ID ke localStorage
 */
export function saveGoogleClientId(clientId) {
  if (clientId && clientId.trim()) {
    localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_CLIENT_ID);
  }
}

/**
 * Mengecek apakah SDK Google Identity Services sudah siap di window
 */
export function isGoogleAvailable() {
  return typeof window !== 'undefined' && !!(window.google && window.google.accounts);
}

/**
 * Format objek user Google untuk ChaizStore
 */
export function formatGoogleUser(data) {
  const name = data.name || data.given_name || 'Pengguna Google';
  return {
    provider: 'google',
    role: 'google_user',
    name: name,
    email: data.email || '',
    picture: data.picture || '',
    avatarLetter: name.charAt(0).toUpperCase(),
    isMember: false,
    isGoogle: true,
    emailVerified: data.email_verified ?? true,
    loginTime: new Date().toISOString()
  };
}

/**
 * Login Google via OAuth2 Token Client (Popup Akun Google Asli)
 */
export function triggerGooglePopupLogin({ clientId, onSuccess, onError }) {
  const activeClientId = clientId || getActiveGoogleClientId();

  if (!activeClientId) {
    onError?.(new Error('GOOGLE_CLIENT_ID_MISSING'));
    return;
  }

  if (!isGoogleAvailable()) {
    onError?.(new Error('GOOGLE_SDK_NOT_LOADED'));
    return;
  }

  try {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: activeClientId,
      scope: 'openid email profile',
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          console.error('Google OAuth Error:', tokenResponse.error);
          onError?.(new Error(tokenResponse.error));
          return;
        }

        try {
          // Ambil profil asli user dari endpoint Google UserInfo
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`
            }
          });

          if (!res.ok) {
            throw new Error(`Google API error: ${res.status}`);
          }

          const userInfo = await res.json();
          const formatted = formatGoogleUser(userInfo);
          onSuccess?.(formatted);
        } catch (fetchErr) {
          console.error('Gagal mengambil data profil Google:', fetchErr);
          onError?.(fetchErr);
        }
      }
    });

    tokenClient.requestAccessToken({ prompt: 'select_account' });
  } catch (err) {
    console.error('Error inisialisasi Google Token Client:', err);
    onError?.(err);
  }
}

/**
 * Render Tombol Resmi Google Identity Services (GIS iframe button)
 */
export function renderOfficialGoogleButton(containerElement, { clientId, onSuccess, onError, options = {} }) {
  const activeClientId = clientId || getActiveGoogleClientId();

  if (!activeClientId || !containerElement || !isGoogleAvailable()) {
    return false;
  }

  try {
    window.google.accounts.id.initialize({
      client_id: activeClientId,
      callback: (response) => {
        if (!response.credential) {
          onError?.(new Error('No credential returned'));
          return;
        }
        const payload = parseJwt(response.credential);
        if (!payload) {
          onError?.(new Error('Failed to parse Google ID token'));
          return;
        }
        const formatted = formatGoogleUser(payload);
        onSuccess?.(formatted);
      }
    });

    window.google.accounts.id.renderButton(containerElement, {
      type: 'standard',
      theme: options.theme || 'outline',
      size: options.size || 'large',
      text: options.text || 'continue_with',
      shape: options.shape || 'pill',
      logo_alignment: 'left',
      width: options.width || 280,
      ...options
    });

    return true;
  } catch (err) {
    console.error('Gagal render tombol resmi Google:', err);
    return false;
  }
}
