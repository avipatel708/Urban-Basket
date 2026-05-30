import { Camera } from "lucide-react"

interface VisualSearchButtonProps {
  onClick: () => void
  className?: string
  silent?: boolean
}

export function VisualSearchButton({
  onClick,
  className = "h-7 w-7",
  silent = false,
}: VisualSearchButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center justify-center rounded-full text-surface-400 hover:text-primary-400 transition-colors cursor-pointer ${className}`}
      aria-label="Search by image"
      title="Visual search — upload or capture a photo"
    >
      <Camera className={silent ? "w-4 h-4" : "w-4 h-4"} />
    </button>
  )
}
