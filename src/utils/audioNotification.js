// Utilitas Notifikasi Suara ChaizStore (Loud, Jernih & Kompatibel Semua Browser & Ponsel)

let audioContext = null;
let isAudioUnlocked = false;

// Audio element cache agar tidak ada delay download saat notifikasi dipicu
const cachedAudios = {
  admin: null,
  success: null,
  notice: null,
  rejected: null
};

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
 * Membuka izin audio browser (AudioContext & HTML5 Audio) saat ada interaksi pertama
 */
export function unlockAudio() {
  if (typeof window === 'undefined') return;

  try {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          isAudioUnlocked = true;
        }).catch(() => {});
      } else {
        isAudioUnlocked = true;
      }

      // Mainkan 1-sample silent buffer untuk membuka kunci autoplay mobile Safari & Android Chrome
      try {
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      } catch (e) {}
    }

      // Preload file suara di background
      if (!cachedAudios.admin) {
        cachedAudios.admin = new Audio('/sounds/admin-order.wav');
        cachedAudios.admin.load();
      }
      if (!cachedAudios.success) {
        cachedAudios.success = new Audio('/sounds/user-success.wav');
        cachedAudios.success.load();
      }
      if (!cachedAudios.rejected) {
        cachedAudios.rejected = new Audio('/sounds/rejected.wav');
        cachedAudios.rejected.load();
      }
      if (!cachedAudios.notice) {
        cachedAudios.notice = new Audio('/sounds/notice.wav');
        cachedAudios.notice.load();
      }
  } catch (e) {}
}

// Buka kunci otomatis saat ada klik, sentuh, atau ketik pertama
if (typeof window !== 'undefined') {
  const handleInteraction = () => {
    unlockAudio();
    getAudioContext();
  };

  window.addEventListener('click', handleInteraction, { passive: true });
  window.addEventListener('touchstart', handleInteraction, { passive: true });
  window.addEventListener('keydown', handleInteraction, { passive: true });
}

export function isAudioContextUnlocked() {
  if (typeof window === 'undefined') return false;
  return isAudioUnlocked && (!audioContext || audioContext.state === 'running');
}

/**
 * Cek apakah suara notifikasi aktif
 */
export function isSoundEnabled() {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem('chaiz_sound_enabled');
    return val !== 'false'; // default aktif
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
 * Getar ponsel untuk notifikasi di perangkat mobile Android
 */
export function triggerNotificationVibrate(type = 'success') {
  if (typeof window === 'undefined' || !('navigator' in window) || !navigator.vibrate) return;
  try {
    if (type === 'success') {
      navigator.vibrate([120, 80, 160]); // Getar gembira: pendek - jeda - panjang
    } else if (type === 'rejected') {
      navigator.vibrate([220, 100, 220]); // Getar peringatan: dua ketukan tegas
    } else {
      navigator.vibrate(80);
    }
  } catch (e) {}
}

/**
 * Sintesis Nada Web Audio API
 */
function playToneSynth(freq, startTime, duration, type = 'sine', gainLevel = 0.8) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

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
  } catch (err) {}
}

export function playAdminSynthFallback() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    // Nada Bel Kasir Nyaring & Elegan: G5 -> C6 -> E6 -> G6
    playToneSynth(783.99, now, 0.25, 'triangle', 0.85); // G5
    playToneSynth(1046.50, now + 0.12, 0.30, 'sine', 0.90); // C6
    playToneSynth(1318.51, now + 0.24, 0.35, 'triangle', 0.90); // E6
    playToneSynth(1567.98, now + 0.36, 0.65, 'sine', 0.95); // G6 bell ring
  } catch (e) {}
}

/**
 * Melodi Kemenangan Sukses Pelanggan: C5 -> E5 -> G5 -> C6 (Jernih, Nyaring & Elegan)
 */
export function playUserSynthFallback() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    playToneSynth(523.25, now, 0.28, 'sine', 0.85);       // C5
    playToneSynth(659.25, now + 0.11, 0.32, 'triangle', 0.90);   // E5
    playToneSynth(783.99, now + 0.22, 0.36, 'sine', 0.92);       // G5
    playToneSynth(1046.50, now + 0.34, 0.70, 'triangle', 0.96);  // C6 grand chime
  } catch (e) {}
}

/**
 * Melodi Nada Peringatan Ditolak: Descending Alert Buzzer (F4 -> D4 -> C4)
 */
export function playUserRejectFallback() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    playToneSynth(349.23, now, 0.26, 'sawtooth', 0.85); // F4
    playToneSynth(293.66, now + 0.20, 0.28, 'triangle', 0.88); // D4
    playToneSynth(261.63, now + 0.40, 0.50, 'sawtooth', 0.92); // C4 alert tone
  } catch (e) {}
}

/**
 * 🔔 Suara Notifikasi Pesanan Masuk (Khusus ADMIN)
 */
export function playAdminOrderSound() {
  if (!isSoundEnabled()) return;
  unlockAudio();

  let wavStarted = false;
  try {
    if (!cachedAudios.admin) {
      cachedAudios.admin = new Audio('/sounds/admin-order.wav');
    }
    const audio = cachedAudios.admin;
    audio.volume = 1.0;
    audio.currentTime = 0;
    const p = audio.play();
    if (p !== undefined) {
      p.then(() => {
        wavStarted = true;
      }).catch(() => {
        playAdminSynthFallback();
      });
    }
  } catch (e) {
    playAdminSynthFallback();
  }

  // Backup instan jika audio HTML5 tidak memicu play dalam 100ms
  try {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      setTimeout(() => {
        if (!wavStarted) playAdminSynthFallback();
      }, 100);
    }
  } catch (e) {}
}

/**
 * 🎉 Suara Notifikasi Pesanan Selesai / Dikirim (Khusus PENGGUNA)
 * WAJIB: Memastikan suara terdengar dengan memicu Audio WAV dan Web Audio synth fallback
 */
export function playUserSuccessSound() {
  if (!isSoundEnabled()) return;
  unlockAudio();
  triggerNotificationVibrate('success');

  let wavStarted = false;
  try {
    const audio = cachedAudios.success || new Audio('/sounds/user-success.wav');
    audio.currentTime = 0;
    audio.volume = 1.0;
    const p = audio.play();
    if (p !== undefined) {
      p.then(() => {
        wavStarted = true;
      }).catch(() => {
        playUserSynthFallback();
      });
    }
  } catch (err) {
    playUserSynthFallback();
  }

  // Backup instan jika file audio terhambat load atau kebijakan browser
  try {
    setTimeout(() => {
      if (!wavStarted) {
        playUserSynthFallback();
      }
    }, 80);
  } catch (e) {}
}

/**
 * ❌ Suara Notifikasi Pesanan Ditolak (Khusus PENGGUNA)
 * WAJIB: Memastikan nada peringatan terdengar jelas saat admin menolak pesanan
 */
export function playUserRejectSound() {
  if (!isSoundEnabled()) return;
  unlockAudio();
  triggerNotificationVibrate('rejected');

  let wavStarted = false;
  try {
    const audio = cachedAudios.rejected || new Audio('/sounds/rejected.wav');
    audio.currentTime = 0;
    audio.volume = 1.0;
    const p = audio.play();
    if (p !== undefined) {
      p.then(() => {
        wavStarted = true;
      }).catch(() => {
        playUserRejectFallback();
      });
    }
  } catch (err) {
    playUserRejectFallback();
  }

  // Backup instan jika file audio terhambat load
  try {
    setTimeout(() => {
      if (!wavStarted) {
        playUserRejectFallback();
      }
    }, 80);
  } catch (e) {}
}

/**
 * ℹ️ Suara Notifikasi Ringan (Saat Checkout / Status Update)
 */
export function playUserNoticeSound() {
  if (!isSoundEnabled()) return;
  unlockAudio();

  try {
    const audio = cachedAudios.notice || new Audio('/sounds/notice.wav');
    audio.currentTime = 0;
    audio.volume = 1.0;
    const p = audio.play();
    if (p !== undefined) {
      p.catch(() => {
        const ctx = getAudioContext();
        if (ctx) {
          const now = ctx.currentTime;
          playToneSynth(880.00, now, 0.15, 'sine', 0.7);
          playToneSynth(1318.51, now + 0.12, 0.35, 'triangle', 0.8);
        }
      });
    }
  } catch (err) {}
}

// Bantuan debugging & testing suara via console DevTools
if (typeof window !== 'undefined') {
  window.chaizAudio = {
    playSuccess: playUserSuccessSound,
    playReject: playUserRejectSound,
    playNotice: playUserNoticeSound,
    unlock: unlockAudio
  };
}
