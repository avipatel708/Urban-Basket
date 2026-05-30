import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { Camera, ImagePlus, Upload, X, Search, RotateCcw, Circle } from "lucide-react"
import { toast } from "sonner"
import {
  compressImageFile,
  readFileAsPreviewUrl,
  revokePreviewUrl,
  validateImageFile,
  fileToDataUrl,
} from "@/utils/imageSimilarity"
import { saveVisualSearchSession } from "@/utils/visualSearchHistory"
import { VisualSearchScanningOverlay } from "./VisualSearchResults"

interface ImageUploadModalProps {
  open: boolean
  onClose: () => void
}

type Step = "pick" | "camera" | "preview" | "scanning"

export function ImageUploadModal({ open, onClose }: ImageUploadModalProps) {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [step, setStep] = useState<Step>("pick")
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraReady(false)
  }, [])

  const reset = useCallback(() => {
    stopCamera()
    if (previewUrl) revokePreviewUrl(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    setStep("pick")
    setDragOver(false)
  }, [previewUrl, stopCamera])

  const handleClose = () => {
    reset()
    onClose()
  }

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  const acceptFile = async (picked: File) => {
    const err = validateImageFile(picked)
    if (err) {
      toast.error(err)
      return
    }
    try {
      stopCamera()
      const compressed = await compressImageFile(picked)
      if (previewUrl) revokePreviewUrl(previewUrl)
      setFile(compressed)
      setPreviewUrl(readFileAsPreviewUrl(compressed))
      setStep("preview")
    } catch {
      toast.error("Could not process that image.")
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0]
    if (picked) acceptFile(picked)
    e.target.value = ""
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const picked = e.dataTransfer.files?.[0]
    if (picked) acceptFile(picked)
  }

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Camera not supported in this browser. Use Upload image instead.")
      return
    }

    setStep("camera")
    setCameraReady(false)

    try {
      stopCamera()

      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: isMobile ? { ideal: "environment" } : "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraReady(true)
      }
    } catch (err: unknown) {
      setStep("pick")
      const name = err instanceof Error ? err.name : ""
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        toast.error("Camera permission denied. Allow camera access or upload an image.")
      } else if (name === "NotFoundError") {
        toast.error("No camera found. Use Upload image instead.")
      } else {
        toast.error("Could not open camera. Try Upload image instead.")
      }
    }
  }

  const capturePhoto = async () => {
    const video = videoRef.current
    if (!video || !cameraReady) return

    const w = video.videoWidth || 640
    const h = video.videoHeight || 480
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0, w, h)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9)
    )
    if (!blob) {
      toast.error("Could not capture photo.")
      return
    }

    const captured = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" })
    stopCamera()
    await acceptFile(captured)
  }

  const runSearch = async () => {
    if (!file) return
    setStep("scanning")
    try {
      const { runVisualSearch } = await import("@/utils/visualSearchEngine")
      const result = await runVisualSearch(file)
      const sessionPreview = await fileToDataUrl(file)
      saveVisualSearchSession({
        previewUrl: sessionPreview,
        analysis: result.analysis,
        results: result.results,
        fallback: result.fallback,
      })
      if (result.previewUrl.startsWith("blob:")) revokePreviewUrl(result.previewUrl)
      onClose()
      reset()
      navigate("/products/visual-search")
    } catch (err: unknown) {
      setStep("preview")
      toast.error(err instanceof Error ? err.message : "Visual search failed")
    }
  }

  if (!open) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-surface-950/70 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-3xl glass border border-surface-800/50 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-800/40">
              <div>
                <h2 className="font-display font-bold text-base text-surface-50">Visual Search</h2>
                <p className="text-[11px] text-surface-400 font-sans mt-0.5">
                  Upload or capture — AI finds similar products
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 rounded-full text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 relative min-h-[280px]">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
                onChange={onFileChange}
              />

              {step === "pick" && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
                    dragOver
                      ? "border-primary-500/60 bg-primary-500/10"
                      : "border-surface-700/50 bg-surface-950/30"
                  }`}
                >
                  <Upload className="w-10 h-10 text-primary-400 mx-auto mb-3 opacity-80" />
                  <p className="text-sm font-semibold text-surface-200">Drop an image here</p>
                  <p className="text-[11px] text-surface-500 mt-1 font-sans">JPG, PNG or WEBP · max 8 MB</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-surface-700/50 text-xs font-semibold text-surface-200 hover:border-primary-500/40 cursor-pointer"
                    >
                      <ImagePlus className="w-3.5 h-3.5" />
                      Upload image
                    </button>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-primary text-xs font-semibold text-white cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Open camera
                    </button>
                  </div>
                </div>
              )}

              {step === "camera" && (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden border border-surface-800/50 aspect-video bg-surface-950">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className="w-full h-full object-cover mirror"
                      style={{ transform: "scaleX(-1)" }}
                    />
                    {!cameraReady && (
                      <div className="absolute inset-0 flex items-center justify-center bg-surface-950/80">
                        <p className="text-xs text-surface-400 animate-pulse">Starting camera…</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        stopCamera()
                        setStep("pick")
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-full glass border border-surface-700/50 text-xs font-semibold text-surface-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      disabled={!cameraReady}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-full gradient-primary text-xs font-semibold text-white cursor-pointer disabled:opacity-45"
                    >
                      <Circle className="w-3.5 h-3.5 fill-current" />
                      Capture photo
                    </button>
                  </div>
                </div>
              )}

              {step === "preview" && previewUrl && (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden border border-surface-800/50 aspect-video bg-surface-950/50">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={reset}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-full glass border border-surface-700/50 text-xs font-semibold text-surface-300 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Change image
                    </button>
                    <button
                      type="button"
                      onClick={runSearch}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-full gradient-primary text-xs font-semibold text-white shadow-lg shadow-primary-500/20 cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Search visually
                    </button>
                  </div>
                </div>
              )}

              {step === "scanning" && (
                <div className="relative min-h-[240px] rounded-2xl overflow-hidden">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm"
                    />
                  )}
                  <VisualSearchScanningOverlay />
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
