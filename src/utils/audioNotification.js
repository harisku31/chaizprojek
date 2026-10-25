// Utilitas Notifikasi Suara ChaizStore (Loud, Jernih & Kompatibel Semua Browser)

let audioContext = null;
let isAudioUnlocked = false;

// Audio elements cache
let adminAudioEl = null;
let userAudioEl = null;
let noticeAudioEl = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  if (!audioContext) {
    audioContext = new AudioCtx();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

/**
 * Membuka izin audio browser (AudioContext & HTML5 Audio) dengan interaksi pengguna
 */
export function unlockAudio() {
  if (typeof window === 'undefined') return;

  // 1. Unlock AudioContext
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        isAudioUnlocked = true;
      }).catch(() => {});
    } else if (ctx) {
      isAudioUnlocked = true;
    }
  } catch (e) {}

  // 2. Pre-warm HTML5 Audio elements
  try {
    if (!adminAudioEl) {
      adminAudioEl = new Audio('/sounds/admin-order.wav');
      adminAudioEl.volume = 1.0;
    }
    if (!userAudioEl) {
      userAudioEl = new Audio('/sounds/user-success.wav');
      userAudioEl.volume = 1.0;
    }
    if (!noticeAudioEl) {
      noticeAudioEl = new Audio('/sounds/notice.wav');
      noticeAudioEl.volume = 1.0;
    }
  } catch (e) {}
}

// Pasang listener interaksi global agar audio langsung terbuka saat user klik atau sentuh layar
if (typeof window !== 'undefined') {
  const handleInteraction = () => {
    unlockAudio();
    window.removeEventListener('click', handleInteraction);
    window.removeEventListener('touchstart', handleInteraction);
    window.removeEventListener('keydown', handleInteraction);
  };

  window.addEventListener('click', handleInteraction, { passive: true });
  window.addEventListener('touchstart', handleInteraction, { passive: true });
  window.addEventListener('keydown', handleInteraction, { passive: true });
}

/**
 * Cek preferensi suara aktif / mute
 */
export function isSoundEnabled() {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem('chaiz_sound_enabled');
    return val !== 'false'; // default aktif (true)
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
 * Sintesis Nada Web Audio API Cadangan (Jika file audio belum terload / offline)
 */
function playToneSynth(freq, startTime, duration, type = 'sine', gainLevel = 0.5) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(gainLevel, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  } catch (err) {}
}

function playAdminSynthFallback() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    playToneSynth(783.99, now, 0.25, 'triangle', 0.6); // G5
    playToneSynth(1046.50, now + 0.12, 0.30, 'sine', 0.7); // C6
    playToneSynth(1318.51, now + 0.24, 0.35, 'triangle', 0.7); // E6
    playToneSynth(1567.98, now + 0.36, 0.60, 'sine', 0.8); // G6 bell
  } catch (e) {}
}

function playUserSynthFallback() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    playToneSynth(523.25, now, 0.30, 'sine', 0.6); // C5
    playToneSynth(659.25, now + 0.12, 0.35, 'triangle', 0.65); // E5
    playToneSynth(783.99, now + 0.24, 0.40, 'sine', 0.7); // G5
    playToneSynth(1046.50, now + 0.36, 0.75, 'sine', 0.85); // C6
  } catch (e) {}
}

/**
 * 🔔 Mainkan Suara Notifikasi Pesanan Baru (Khusus ADMIN)
 * Memainkan file /sounds/admin-order.wav dengan fallback Web Audio synthesizer
 */
export function playAdminOrderSound() {
  if (!isSoundEnabled()) return;
  unlockAudio();

  let played = false;
  try {
    const audio = new Audio('/sounds/admin-order.wav');
    audio.volume = 1.0;
    const promise = audio.play();
    if (promise !== undefined) {
      promise
        .then(() => {
          played = true;
        })
        .catch(() => {
          // Jika browser memblokir HTML5 Audio, fallback ke Web Audio synth
          playAdminSynthFallback();
        });
    }
  } catch (err) {
    playAdminSynthFallback();
  }
}

/**
 * 🎉 Mainkan Suara Notifikasi Pesanan Selesai / Dikirim (Khusus PENGGUNA)
 */
export function playUserSuccessSound() {
  if (!isSoundEnabled()) return;
  unlockAudio();

  try {
    const audio = new Audio('/sounds/user-success.wav');
    audio.volume = 1.0;
    const promise = audio.play();
    if (promise !== undefined) {
      promise.catch(() => {
        playUserSynthFallback();
      });
    }
  } catch (err) {
    playUserSynthFallback();
  }
}

/**
 * ℹ️ Mainkan Suara Notifikasi Ringan (Perhatian / Status Update)
 */
export function playUserNoticeSound() {
  if (!isSoundEnabled()) return;
  unlockAudio();

  try {
    const audio = new Audio('/sounds/notice.wav');
    audio.volume = 1.0;
    const promise = audio.play();
    if (promise !== undefined) {
      promise.catch(() => {
        const ctx = getAudioContext();
        if (ctx) {
          const now = ctx.currentTime;
          playToneSynth(880.00, now, 0.15, 'sine', 0.5);
          playToneSynth(1318.51, now + 0.12, 0.35, 'triangle', 0.6);
        }
      });
    }
  } catch (err) {}
}

/**
 * ❌ Mainkan Suara Notifikasi Pesanan Ditolak
 */
export function playUserRejectSound() {
  if (!isSoundEnabled()) return;
  unlockAudio();

  try {
    const ctx = getAudioContext();
    if (ctx) {
      const now = ctx.currentTime;
      playToneSynth(440.00, now, 0.22, 'triangle', 0.6);
      playToneSynth(349.23, now + 0.20, 0.40, 'sine', 0.65);
    }
  } catch (err) {}
}
