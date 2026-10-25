// Utilitas Notifikasi Suara ChaizStore (Loud, Jernih & Kompatibel Semua Browser)

let audioContext = null;
let isAudioUnlocked = false;

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
 * Membuka izin audio browser (AudioContext & HTML5 Audio) saat ada interaksi
 */
export function unlockAudio() {
  if (typeof window === 'undefined') return;

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
}

// Buka kunci otomatis saat ada klik, sentuh, atau ketik pertama
if (typeof window !== 'undefined') {
  const handleInteraction = () => {
    unlockAudio();
    // Pre-create AudioContext
    getAudioContext();
  };

  window.addEventListener('click', handleInteraction, { passive: true });
  window.addEventListener('touchstart', handleInteraction, { passive: true });
  window.addEventListener('keydown', handleInteraction, { passive: true });
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

export function playUserSynthFallback() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    // Melodi Kemenangan Sukses: C5 -> E5 -> G5 -> C6
    playToneSynth(523.25, now, 0.30, 'sine', 0.80);
    playToneSynth(659.25, now + 0.12, 0.35, 'triangle', 0.85);
    playToneSynth(783.99, now + 0.24, 0.40, 'sine', 0.90);
    playToneSynth(1046.50, now + 0.36, 0.75, 'sine', 0.95);
  } catch (e) {}
}

/**
 * 🔔 Suara Notifikasi Pesanan Masuk (Khusus ADMIN)
 * Memastikan suara terdengar dengan memicu Audio WAV dan Web Audio synth
 */
export function playAdminOrderSound() {
  if (!isSoundEnabled()) return;
  unlockAudio();

  let wavStarted = false;
  try {
    const audio = new Audio('/sounds/admin-order.wav');
    audio.volume = 1.0;
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

  // Backup instan dengan synth jika AudioContext sudah berjalan
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'running' && !wavStarted) {
      setTimeout(() => {
        if (!wavStarted) playAdminSynthFallback();
      }, 50);
    }
  } catch (e) {}
}

/**
 * 🎉 Suara Notifikasi Pesanan Selesai / Dikirim (Khusus PENGGUNA)
 */
export function playUserSuccessSound() {
  if (!isSoundEnabled()) return;
  unlockAudio();

  try {
    const audio = new Audio('/sounds/user-success.wav');
    audio.volume = 1.0;
    const p = audio.play();
    if (p !== undefined) {
      p.catch(() => {
        playUserSynthFallback();
      });
    }
  } catch (err) {
    playUserSynthFallback();
  }
}

/**
 * ℹ️ Suara Notifikasi Ringan (Saat Checkout / Status Update)
 */
export function playUserNoticeSound() {
  if (!isSoundEnabled()) return;
  unlockAudio();

  try {
    const audio = new Audio('/sounds/notice.wav');
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

/**
 * ❌ Suara Notifikasi Pesanan Ditolak
 */
export function playUserRejectSound() {
  if (!isSoundEnabled()) return;
  unlockAudio();

  try {
    const ctx = getAudioContext();
    if (ctx) {
      const now = ctx.currentTime;
      playToneSynth(440.00, now, 0.22, 'triangle', 0.7);
      playToneSynth(349.23, now + 0.20, 0.40, 'sine', 0.75);
    }
  } catch (err) {}
}
