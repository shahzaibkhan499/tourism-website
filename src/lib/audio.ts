// ============================================================
// AUDIO ENGINE — global AudioContext singleton + all sounds.
// Fix 4 (master prompt): playQuranAudio, playAlarm, playChime.
// All functions are browser-safe (no-op during SSR) and resume
// a suspended AudioContext before playing (autoplay policy).
// ============================================================

type AudioContextCtor = typeof AudioContext;

let audioCtx: AudioContext | null = null;
let quranAudioEl: HTMLAudioElement | null = null;
let alarmGeneration = 0;
let activeAlarmOscs: OscillatorNode[] = [];
let lastChimeAt = 0;

export const NOTIFICATION_SOUND_KEY = "dk-notification-sound";
export const QURAN_PRIMARY_BASE = "https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy";
export const QURAN_FALLBACK_BASE = "https://server8.mp3quran.net/afs";

export function quranStreamUrl(surahId: number, fallback = false): string {
  if (fallback) return `${QURAN_FALLBACK_BASE}/${String(surahId).padStart(3, "0")}.mp3`;
  return `${QURAN_PRIMARY_BASE}/${surahId}.mp3`;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor: AudioContextCtor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) {
    try {
      audioCtx = new Ctor();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

async function resumeCtx(): Promise<AudioContext | null> {
  const ctx = getAudioContext();
  if (!ctx) return null;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      /* resume may fail without user gesture — ignore */
    }
  }
  return ctx;
}

// Initialize the AudioContext on the first user interaction anywhere
// in the app (autoplay policy). Called from <AudioInitializer />.
export function initAudioOnFirstInteraction(): void {
  if (typeof window === "undefined") return;
  const handler = () => {
    getAudioContext();
  };
  window.addEventListener("pointerdown", handler, { once: true, passive: true });
  window.addEventListener("keydown", handler, { once: true, passive: true });
  window.addEventListener("touchstart", handler, { once: true, passive: true });
}

// ---------- notification sound preference ----------
export function isNotificationSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(NOTIFICATION_SOUND_KEY) !== "off";
}

export function setNotificationSoundEnabled(on: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTIFICATION_SOUND_KEY, on ? "on" : "off");
}

// ---------- low-level tone ----------
interface ToneOptions {
  freq: number;
  durationMs: number;
  gain?: number;
  type?: OscillatorType;
  delayMs?: number;
}

async function playTone({ freq, durationMs, gain = 0.3, type = "sine", delayMs = 0 }: ToneOptions): Promise<OscillatorNode | null> {
  const ctx = await resumeCtx();
  if (!ctx) return null;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ctx.currentTime + delayMs / 1000;
  const end = t0 + durationMs / 1000;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(gain, 0.001), t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(end + 0.05);
  return osc;
}

// ---------- FIX 2: medicine alarm (800Hz sine, 1s, ×3) ----------
export async function playAlarm(): Promise<{ stop: () => void } | null> {
  const ctx = await resumeCtx();
  if (!ctx) return null;

  const myGeneration = ++alarmGeneration;
  // stop any previously active alarm beeps
  stopAlarm();

  const oscs: OscillatorNode[] = [];
  const beep = async (delayMs: number) => {
    if (myGeneration !== alarmGeneration) return;
    const osc = await playTone({ freq: 800, durationMs: 1000, gain: 0.5, type: "sine", delayMs });
    if (osc) oscs.push(osc);
  };
  // 3 beeps: 0s, 1.4s, 2.8s
  void beep(0);
  void beep(1400);
  void beep(2800);

  activeAlarmOscs = oscs;
  return {
    stop: () => {
      if (myGeneration === alarmGeneration) {
        alarmGeneration++;
        for (const o of activeAlarmOscs) {
          try {
            o.stop();
          } catch {
            /* already stopped */
          }
        }
        activeAlarmOscs = [];
      }
    },
  };
}

export function stopAlarm(): void {
  alarmGeneration++;
  for (const o of activeAlarmOscs) {
    try {
      o.stop();
    } catch {
      /* already stopped */
    }
  }
  activeAlarmOscs = [];
}

// ---------- FIX 3: notification chime (C5→E5, 0.3s each, gain 0.3) ----------
export async function playChime(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isNotificationSoundEnabled()) return;
  // only chime while the tab is visible (configurable via localStorage)
  if (document.visibilityState !== "visible") return;
  const now = Date.now();
  if (now - lastChimeAt < 5000) return; // throttle: no double chimes from multiple pollers
  lastChimeAt = now;
  await playTone({ freq: 523.25, durationMs: 300, gain: 0.3 }); // C5
  await playTone({ freq: 659.25, durationMs: 300, gain: 0.3, delayMs: 320 }); // E5
}

// ---------- FIX 1: Quran recitation player ----------
export async function playQuranAudio(url: string): Promise<HTMLAudioElement | null> {
  if (typeof window === "undefined") return null;
  stopQuranAudio();
  await resumeCtx();
  const el = new Audio();
  el.src = url;
  el.preload = "auto";
  quranAudioEl = el;
  try {
    await el.play();
  } catch {
    /* autoplay may be blocked — caller shows the button to retry */
  }
  return el;
}

export function getQuranAudioElement(): HTMLAudioElement | null {
  return quranAudioEl;
}

export function stopQuranAudio(): void {
  if (quranAudioEl) {
    try {
      quranAudioEl.pause();
      quranAudioEl.src = "";
      quranAudioEl.load();
    } catch {
      /* ignore */
    }
    quranAudioEl = null;
  }
}

export function setQuranVolume(volume: number): void {
  if (quranAudioEl) quranAudioEl.volume = Math.min(1, Math.max(0, volume));
}

// Preload metadata only (no audio data) — used for the first surah on page load.
export function preloadQuranMetadata(url: string): void {
  if (typeof window === "undefined") return;
  if (quranAudioEl && quranAudioEl.src === url) return;
  const el = new Audio();
  el.src = url;
  el.preload = "metadata";
  void el.load();
}
