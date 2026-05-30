/**
 * Production-ready voice recognition module for Urban-Basket.
 *
 * Uses a SINGLE reusable SpeechRecognition instance to avoid Chrome's
 * "already started" race condition and duplicate-listener bugs.
 *
 * Flow:
 *   Mic Click → ensureMicrophonePermission() → recognition.start()
 *   → onresult → transcript → callback → recognition.stop()
 */

const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null

const DEFAULT_LANG = "en-IN"
const LISTEN_TIMEOUT_MS = 8000

/** @returns {boolean} */
export function isSpeechRecognitionSupported() {
  return !!SpeechRecognition
}

// ─── Singleton Recognition Instance ──────────────────────────────────────────

/** @type {SpeechRecognition | null} */
let recognition = null
/** @type {{ onResult: (t: string) => void, onError: (e: any) => void, onStart: () => void, onEnd: () => void } | null} */
let currentCallbacks = null
/** @type {ReturnType<typeof setTimeout> | null} */
let timeoutId = null
let isActive = false
let gotResult = false

function getRecognition() {
  if (!SpeechRecognition) return null
  if (recognition) return recognition

  recognition = new SpeechRecognition()
  recognition.continuous = false
  recognition.interimResults = false
  recognition.maxAlternatives = 1
  recognition.lang = DEFAULT_LANG

  // ── onstart ──────────────────────────────────────────────────────────────
  recognition.onstart = () => {
    isActive = true
    gotResult = false
    currentCallbacks?.onStart?.()

    // Safety timeout: if no speech detected within LISTEN_TIMEOUT_MS, stop
    clearTimer()
    timeoutId = setTimeout(() => {
      if (isActive && !gotResult) {
        currentCallbacks?.onError?.({
          type: "timeout",
          message: "No speech detected. Please try again.",
        })
        safeStop()
      }
    }, LISTEN_TIMEOUT_MS)
  }

  // ── onresult ─────────────────────────────────────────────────────────────
  recognition.onresult = (event) => {
    clearTimer()
    gotResult = true

    let transcript = ""
    for (let i = 0; i < event.results.length; i++) {
      transcript += event.results[i]?.[0]?.transcript || ""
    }
    transcript = transcript.trim().toLowerCase()

    if (transcript) {
      currentCallbacks?.onResult?.(transcript)
    } else {
      currentCallbacks?.onError?.({
        type: "no-speech",
        message: "Could not understand speech. Please try again.",
      })
    }

    // Stop after getting a result (continuous = false should do this,
    // but we call stop() explicitly for reliability)
    safeStop()
  }

  // ── onerror ──────────────────────────────────────────────────────────────
  recognition.onerror = (event) => {
    clearTimer()
    const code = event.error || "unknown"

    // "aborted" fires when we intentionally call .stop()/.abort() — ignore
    if (code === "aborted") return

    const messages = {
      "not-allowed": "Microphone access denied. Allow microphone in browser settings.",
      "service-not-allowed": "Microphone is blocked. Check browser or device permissions.",
      "no-speech": "No speech detected. Please try again.",
      "audio-capture": "No microphone found. Connect a microphone and try again.",
      "network": "Network error during voice recognition. Check your connection.",
    }

    currentCallbacks?.onError?.({
      type: code,
      message: messages[code] || "Voice recognition failed. Please try again.",
    })
  }

  // ── onend ────────────────────────────────────────────────────────────────
  recognition.onend = () => {
    clearTimer()
    isActive = false
    currentCallbacks?.onEnd?.()
    currentCallbacks = null
  }

  return recognition
}

function clearTimer() {
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
}

function safeStop() {
  clearTimer()
  if (!recognition) return
  try {
    recognition.stop()
  } catch {
    try {
      recognition.abort()
    } catch {
      /* already stopped */
    }
  }
}

// ─── Microphone Permission ───────────────────────────────────────────────────

/**
 * Request microphone access before SpeechRecognition.
 * Chrome is more reliable when getUserMedia is called first.
 * @returns {Promise<{ ok: boolean, message?: string }>}
 */
export async function ensureMicrophonePermission() {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return { ok: true }
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((track) => track.stop())
    return { ok: true }
  } catch (err) {
    const name = err instanceof Error ? err.name : ""
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return {
        ok: false,
        message: "Microphone access denied. Allow microphone access in browser settings.",
      }
    }
    if (name === "NotFoundError") {
      return {
        ok: false,
        message: "No microphone found. Connect a microphone and try again.",
      }
    }
    return {
      ok: false,
      message: "Could not access microphone. Check browser permissions.",
    }
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Stop any in-progress voice session (e.g. on unmount).
 */
export function stopActiveVoiceRecognition() {
  safeStop()
}

/**
 * Start a voice recognition session.
 *
 * @param {Object} options
 * @param {(transcript: string) => void} options.onResult
 * @param {(error: { type: string, message: string }) => void} [options.onError]
 * @param {() => void} [options.onStart]
 * @param {() => void} [options.onEnd]
 * @param {string} [options.lang]
 * @returns {() => void} stop function
 */
export function startVoiceRecognition({
  onResult,
  onError,
  onStart,
  onEnd,
  lang = DEFAULT_LANG,
}) {
  const rec = getRecognition()
  if (!rec) {
    onError?.({
      type: "unsupported",
      message: "Voice search not supported in this browser. Try Chrome or Edge.",
    })
    return () => {}
  }

  // If currently active, abort the previous session first
  if (isActive) {
    try {
      rec.abort()
    } catch {
      /* ignore */
    }
    // Small delay after abort to let browser clean up
    setTimeout(() => {
      actualStart(rec, { onResult, onError, onStart, onEnd, lang })
    }, 150)
    return () => safeStop()
  }

  actualStart(rec, { onResult, onError, onStart, onEnd, lang })
  return () => safeStop()
}

function actualStart(rec, { onResult, onError, onStart, onEnd, lang }) {
  // Set callbacks BEFORE calling start()
  currentCallbacks = { onResult, onError, onStart, onEnd }
  rec.lang = lang || DEFAULT_LANG
  gotResult = false

  try {
    rec.start()
  } catch (err) {
    isActive = false
    const msg = String(err?.message || "")
    if (msg.toLowerCase().includes("already started")) {
      // Chrome race: abort and retry once
      try {
        rec.abort()
      } catch {
        /* ignore */
      }
      setTimeout(() => {
        try {
          rec.start()
        } catch (retryErr) {
          currentCallbacks = null
          onError?.({
            type: "start-failed",
            message: "Could not start voice recognition. Please try again.",
          })
        }
      }, 200)
    } else {
      currentCallbacks = null
      onError?.({
        type: "start-failed",
        message: "Could not start voice recognition. Please try again.",
      })
    }
  }
}

/**
 * Full voice flow: mic permission → speech recognition.
 * @param {Parameters<typeof startVoiceRecognition>[0]} options
 */
export async function startVoiceSearchSession(options) {
  const mic = await ensureMicrophonePermission()
  if (!mic.ok) {
    options.onError?.({
      type: "not-allowed",
      message: mic.message || "Microphone access denied.",
    })
    return () => {}
  }
  return startVoiceRecognition(options)
}
