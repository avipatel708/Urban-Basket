import { useCallback } from "react"
import { Mic, Loader2 } from "lucide-react"
import { useVoiceSearch } from "@/hooks/useVoiceSearch"

/**
 * @param {Object} props
 * @param {(transcript: string) => void | Promise<void>} props.onTranscript
 * @param {string} [props.className]
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.silent] - parent handles success toasts
 */
export function VoiceSearchButton({ onTranscript, className = "", disabled = false, silent = false }) {
  const { isListening, isProcessing, busy, toggle } = useVoiceSearch({
    onTranscript,
    silent,
  })

  const handleClick = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (disabled || isProcessing) return
      toggle()
    },
    [disabled, isProcessing, toggle]
  )

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isProcessing}
      aria-label={
        isProcessing
          ? "Processing voice search"
          : isListening
            ? "Stop voice search"
            : "Search by voice"
      }
      title={isProcessing ? "Searching…" : isListening ? "Listening…" : "Voice search"}
      aria-pressed={isListening}
      className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        busy ? "text-primary-400" : "text-surface-400 hover:text-primary-400"
      } ${className}`}
    >
      {isListening && (
        <>
          <span
            className="absolute inset-0 rounded-full bg-primary-500/25 animate-ping pointer-events-none"
            aria-hidden
          />
          <span
            className="absolute inset-0 rounded-full bg-primary-500/15 animate-pulse pointer-events-none"
            aria-hidden
          />
        </>
      )}
      {busy && (
        <span
          className="absolute inset-0 rounded-full shadow-[0_0_14px_rgba(99,102,241,0.6)] pointer-events-none"
          aria-hidden
        />
      )}
      {isProcessing ? (
        <Loader2 className="relative w-4 h-4 animate-spin" />
      ) : (
        <Mic className={`relative w-4 h-4 ${isListening ? "animate-pulse scale-110" : ""}`} />
      )}
    </button>
  )
}
