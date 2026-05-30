import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router"
import { motion } from "motion/react"
import { ArrowLeft, Camera } from "lucide-react"
import { VisualSearchResults } from "@/components/visual-search/VisualSearchResults"
import {
  loadVisualSearchSession,
  clearVisualSearchSession,
  type VisualSearchSession,
} from "@/utils/visualSearchHistory"
import { revokePreviewUrl } from "@/utils/imageSimilarity"

export default function VisualSearchPage() {
  const navigate = useNavigate()
  const [session, setSession] = useState<VisualSearchSession | null>(null)

  useEffect(() => {
    const data = loadVisualSearchSession()
    if (!data) {
      navigate("/products", { replace: true })
      return
    }
    setSession(data)
  }, [navigate])

  useEffect(() => {
    return () => {
      const data = loadVisualSearchSession()
      if (data?.previewUrl?.startsWith("blob:")) {
        revokePreviewUrl(data.previewUrl)
      }
    }
  }, [])

  const handleBack = () => {
    clearVisualSearchSession()
    navigate("/products")
  }

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary-500/30 border-t-primary-500 animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8"
    >
      <div>
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs text-surface-400 hover:text-primary-400 transition-colors mb-3 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to products
        </button>
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary-400" />
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-surface-50">
            Visual Search Results
          </h1>
        </div>
        <p className="text-xs text-surface-400 font-sans mt-1">
          AI-matched products from your uploaded image — {session.results.length} found
        </p>
      </div>

      <VisualSearchResults
        previewUrl={session.previewUrl}
        analysis={session.analysis}
        results={session.results}
        fallback={session.fallback}
      />

      <div className="text-center pt-4">
        <Link
          to="/products"
          onClick={() => clearVisualSearchSession()}
          className="text-xs text-primary-400 hover:text-primary-300 font-semibold"
        >
          Browse all products
        </Link>
      </div>
    </motion.div>
  )
}
