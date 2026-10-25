// Utilitas Notifikasi Suara Menggunakan Web Audio API (100% Bebas Dependensi Eksternal & Tidak Pernah 404)

let audioCtx = null;
let isAudioUnlocked = false;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Buka kunci AudioContext saat ada interaksi pertama dari pengguna di browser
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          isAudioUnlocked = true;
        }).catch(() => {});
      } else {
        isAudioUnlocked = true;
      }
    }
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };

  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
}

/**
 * Cek apakah suara notifikasi aktif di preferensi pengguna / admin
 */
export function isSoundEnabled() {
  if (typeof window === 'undefined') return false;
  try {
    const val = localStorage.getItem('chaiz_sound_enabled');
    return val !== 'false'; // default true
  } catch {
    return true;
  }
}

/**
 * Ubah preferensi suara aktif / mute
 */
export function setSoundEnabled(enabled) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('chaiz_sound_enabled', enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('chaiz_sound_setting_changed', { detail: { enabled } }));
  } catch {}
}

/**
 * Helper memainkan nada tunggal dengan oscillator + envelope
 */
function playTone(freq, startTime, duration, type = 'sine', gainLevel = 0.28) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(gainLevel, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  } catch (err) {
    console.warn('Gagal memutar audio tone:', err);
  }
}

/**
 * 🔔 Suara Notifikasi Khusus ADMIN (Pesanan Baru Masuk)
 * Karakter: Nada Chime Ting-Dong-Ring cepat & profesional (D5 -> A5 -> D6)
 */
export function playAdminOrderSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Nada 1: D5 (587 Hz)
    playTone(587.33, now, 0.12, 'sine', 0.25);
    // Nada 2: A5 (880 Hz)
    playTone(880.00, now + 0.11, 0.14, 'triangle', 0.3);
    // Nada 3: D6 (1174 Hz) dengan sustain lebih panjang
    playTone(1174.66, now + 0.23, 0.55, 'sine', 0.35);
    // Harmonik pendukung (F#6) untuk efek ceria
    playTone(1479.98, now + 0.24, 0.45, 'sine', 0.15);
  } catch (e) {
    console.warn('Error playing admin order sound:', e);
  }
}

/**
 * 🎉 Suara Notifikasi Khusus PENGGUNA / PELANGGAN (Pesanan Selesai / Dikirim Admin)
 * Karakter: Ceria, Nada Harpa Kemenangan Sukses (C5 -> E5 -> G5 -> C6)
 */
export function playUserSuccessSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // C5
    playTone(523.25, now, 0.15, 'sine', 0.25);
    // E5
    playTone(659.25, now + 0.10, 0.16, 'sine', 0.28);
    // G5
    playTone(783.99, now + 0.20, 0.18, 'sine', 0.32);
    // C6
    playTone(1046.50, now + 0.32, 0.65, 'sine', 0.38);
    // Harmonik kilau E6
    playTone(1318.51, now + 0.34, 0.55, 'triangle', 0.18);
  } catch (e) {
    console.warn('Error playing user success sound:', e);
  }
}

/**
 * ℹ️ Suara Notifikasi Ringan Pengguna (Status Update / Catatan Masuk)
 * Karakter: Soft Waterdrop Ting (A5 -> E6)
 */
export function playUserNoticeSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    playTone(880.00, now, 0.12, 'sine', 0.25);
    playTone(1318.51, now + 0.10, 0.35, 'triangle', 0.3);
  } catch (e) {
    console.warn('Error playing user notice sound:', e);
  }
}

/**
 * ❌ Suara Notifikasi Pesanan Ditolak / Perhatian
 * Karakter: Soft Alert Dua Nada (D4 -> Bb3)
 */
export function playUserRejectSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    playTone(440.00, now, 0.2, 'triangle', 0.25);
    playTone(349.23, now + 0.18, 0.35, 'sine', 0.28);
  } catch (e) {}
}
