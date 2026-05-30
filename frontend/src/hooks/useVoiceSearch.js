import { useState, useRef, useCallback, useEffect } from "react"
import { toast } from "sonner"
import {
  isSpeechRecognitionSupported,
  startVoiceSearchSession,
  stopActiveVoiceRecognition,
} from "@/utils/voiceRecognition"

/**
 * @param {Object} options
 * @param {(transcript: string) => void | Promise<void>} options.onTranscript
 * @param {(error: { type: string, message: string }) => void} [options.onError]
 * @param {boolean} [options.silent] - skip success toasts only (errors always shown)
 */
export function useVoiceSearch({ onTranscript, onError, silent = false }) {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

  const stopRef = useRef(null)
  const onTranscriptRef = useRef(onTranscript)
  const onErrorRef = useRef(onError)
  const isListeningRef = useRef(false)
  const isProcessingRef = useRef(false)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  useEffect(() => {
    isListeningRef.current = isListening
  }, [isListening])

  useEffect(() => {
    isProcessingRef.current = isProcessing
  }, [isProcessing])

  useEffect(() => {
    return () => {
      if (isListeningRef.current) {
        stopRef.current?.()
        stopRef.current = null
        stopActiveVoiceRecognition()
      }
    }
  }, [])

  const notifyError = useCallback((error) => {
    setIsListening(false)
    setIsProcessing(false)
    setIsStarting(false)
    stopRef.current = null
    onErrorRef.current?.(error)
    toast.error(error?.message || "Voice search failed.", { duration: 3500 })
  }, [])

  const stop = useCallback(() => {
    stopRef.current?.()
    stopRef.current = null
    setIsStarting(false)
    setIsListening(false)
  }, [])

  const start = useCallback(async () => {
    if (isStarting || isProcessingRef.current) return

    if (isListeningRef.current) {
      stop()
      return
    }

    if (!isSpeechRecognitionSupported()) {
      notifyError({
        type: "unsupported",
        message: "Voice search not supported in this browser. Try Chrome or Edge.",
      })
      return
    }

    setIsStarting(true)
    toast.info("Listening… speak your search", { duration: 2500 })

    try {
      stopRef.current = await startVoiceSearchSession({
        lang: "en-IN",
        onStart: () => {
          setIsStarting(false)
          setIsListening(true)
        },
        onEnd: () => {
          setIsStarting(false)
          setIsListening(false)
          stopRef.current = null
        },
        onResult: async (transcript) => {
          setIsProcessing(true)
          try {
            const handler = onTranscriptRef.current
            if (handler) {
              const result = handler(transcript)
              if (result && typeof result.then === "function") {
                await result
              }
            }
            if (!silent) {
              toast.success(`Searching for "${transcript}"`, { duration: 2200 })
            }
          } catch (err) {
            console.error("Voice search handler failed:", err)
            notifyError({
              type: "handler",
              message: "Voice search failed. Try again.",
            })
          } finally {
            setIsProcessing(false)
          }
        },
        onError: notifyError,
      })
    } catch (err) {
      setIsStarting(false)
      notifyError({
        type: "start-failed",
        message: err instanceof Error ? err.message : "Could not start voice search.",
      })
    }
  }, [isStarting, notifyError, silent, stop])

  const toggle = useCallback(() => {
    if (isListeningRef.current) stop()
    else start()
  }, [start, stop])

  return {
    isListening,
    isProcessing,
    busy: isListening || isProcessing || isStarting,
    isSupported: isSpeechRecognitionSupported(),
    start,
    stop,
    toggle,
  }
}
