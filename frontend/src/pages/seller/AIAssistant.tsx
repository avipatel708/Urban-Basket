import { useState } from "react"
import { useNavigate } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { Sparkles, Copy, Check, FileText, ArrowRight, Lightbulb } from "lucide-react"
import { generateProductListing, type AISellerResponse } from "@/services/aiService"
import { toast } from "sonner"

export default function AIAssistant() {
  const navigate = useNavigate()
  const [keywords, setKeywords] = useState("")
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<AISellerResponse | null>(null)
  
  // Track copied status for title, desc, highlights, and tags
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keywords.trim()) {
      toast.error("Please enter some keywords or brief product features.")
      return
    }

    setGenerating(true)
    setResult(null)

    try {
      const response = await generateProductListing(keywords)
      setResult(response)
      toast.success("AI Listing metadata generated successfully!")
    } catch (err: any) {
      toast.error("AI Generation failed. Falling back to local templates.")
      // Generate intelligent fallback directly
      const cleanKeywords = keywords.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
      setResult({
        title: `Premium ${cleanKeywords} Pro`,
        description: `Experience the next generation of technological superiority with our newly launched ${keywords}. Engineered to provide seamless integration, state-of-the-art performance, and ergonomic utility for demanding modern lifestyles.`,
        highlights: [
          "State-of-the-art performance optimization",
          "Ultra-durable ergonomic design construction",
          "Energy-efficient sustainable technology integration",
          "Includes 2-year full premium global warranty support"
        ],
        tags: [keywords.toLowerCase().replace(/\s+/g, "-"), "premium-tech", "cyber-basket", "next-gen"]
      })
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    toast.success(`${fieldName} copied to clipboard!`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleApplyListing = () => {
    if (!result) return
    
    // Save metadata in temporary storage or navigate with state
    navigate("/seller/add-product", {
      state: {
        title: result.title,
        description: result.description
      }
    })
    toast.success("AI listing data applied to draft form!")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-8 font-sans max-w-4xl mx-auto"
    >
      {/* Header Panel */}
      <div>
        <h1 className="font-display font-bold text-xl sm:text-2xl text-surface-50 flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-primary-400" />
          Seller AI Assistant
        </h1>
        <p className="text-xs text-surface-400 mt-0.5">
          Generate SEO-friendly product details, persuasive product descriptions, and keywords instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Input form panel */}
        <div className="lg:col-span-5 rounded-3xl glass p-6 border border-surface-800/40 shadow-xl space-y-5">
          <div className="flex items-center gap-2 text-primary-300">
            <Lightbulb className="w-4 h-4" />
            <h3 className="font-semibold text-xs uppercase tracking-wider">AI Generator</h3>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-surface-450 uppercase tracking-wide">
                Product Core Keywords *
              </label>
              <textarea
                placeholder="e.g. Ergonomic wireless vertical mouse, 2400 DPI, silent buttons, USB-C rechargeable..."
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                rows={5}
                className="w-full glass-light border border-surface-800/50 rounded-2xl py-3 px-4 text-xs focus:outline-none focus:border-primary-500 text-surface-150"
                required
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl gradient-primary text-xs font-semibold text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/35 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Compiling marketing models...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Listing
                </>
              )}
            </button>
          </form>

          {/* Quick instructions / tips */}
          <div className="p-3.5 rounded-2xl bg-surface-950/20 border border-surface-800/40">
            <h4 className="text-[10px] font-bold text-surface-300 uppercase tracking-wider">Quick Prompts Tips</h4>
            <ul className="text-[10px] text-surface-450 mt-1.5 space-y-1 pl-3.5 list-disc leading-relaxed font-sans">
              <li>Include the primary category name (e.g. Laptop, shoes).</li>
              <li>Detail 2-3 specific features or technical specs.</li>
              <li>Input any unique selling points (e.g. 50% recycled plastic).</li>
            </ul>
          </div>
        </div>

        {/* Right Output details panel */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatePresence mode="wait">
            {!result ? (
              /* Initial state visual */
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="rounded-3xl glass p-10 border border-surface-800/40 flex flex-col justify-center items-center text-center space-y-4 min-h-[380px]"
              >
                <div className="w-14 h-14 rounded-2xl bg-surface-900/50 border border-surface-800/60 flex items-center justify-center text-surface-450 shadow-inner">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-sm text-surface-200">No Metadata Compiled</h3>
                  <p className="text-xs text-surface-450 max-w-sm mt-1 leading-relaxed">
                    Write down keywords or key specifications on the left pane and generate your professional technological listing.
                  </p>
                </div>
              </motion.div>
            ) : (
              /* Generated results block */
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {/* 1. Title section */}
                <div className="rounded-3xl glass p-5 border border-surface-800/40 space-y-2 relative group shadow-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-surface-450 uppercase tracking-wide">
                      SEO Optimized Title
                    </span>
                    <button
                      onClick={() => copyToClipboard(result.title, "Title")}
                      className="p-1.5 rounded-lg glass-light border border-surface-800 text-surface-400 hover:text-primary-400 hover:border-primary-500/20 transition-all cursor-pointer"
                      title="Copy Title"
                    >
                      {copiedField === "Title" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-sm font-sans font-bold text-surface-50 pr-8">
                    {result.title}
                  </p>
                </div>

                {/* 2. Description section */}
                <div className="rounded-3xl glass p-5 border border-surface-800/40 space-y-2.5 relative group shadow-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-surface-450 uppercase tracking-wide">
                      Marketing Description
                    </span>
                    <button
                      onClick={() => copyToClipboard(result.description, "Description")}
                      className="p-1.5 rounded-lg glass-light border border-surface-800 text-surface-400 hover:text-primary-400 hover:border-primary-500/20 transition-all cursor-pointer"
                      title="Copy Description"
                    >
                      {copiedField === "Description" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-xs font-sans text-surface-200 leading-relaxed pr-8 whitespace-pre-wrap">
                    {result.description}
                  </p>
                </div>

                {/* 3. Specs / Highlights */}
                <div className="rounded-3xl glass p-5 border border-surface-800/40 space-y-3 shadow-lg">
                  <span className="text-[10px] font-bold text-surface-450 uppercase tracking-wide block">
                    Product Highlights & Bullet Points
                  </span>
                  <div className="space-y-2">
                    {result.highlights.map((bullet, idx) => (
                      <div key={idx} className="flex gap-2 text-xs font-sans text-surface-200 pl-1 leading-relaxed">
                        <span className="text-primary-400 font-bold">•</span>
                        <p className="flex-1">{bullet}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. SEO tag badges */}
                <div className="rounded-3xl glass p-5 border border-surface-800/40 space-y-3 shadow-lg">
                  <span className="text-[10px] font-bold text-surface-450 uppercase tracking-wide block">
                    Recommended Keywords & Tags
                  </span>
                  <div className="flex flex-wrap gap-2 animate-fade-in">
                    {result.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-primary-500/20 bg-primary-500/5 text-primary-400 hover:bg-primary-500/10 hover:border-primary-500/40 transition-colors"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Final Apply button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleApplyListing}
                    className="inline-flex items-center gap-2 py-3 px-8 rounded-2xl gradient-primary text-xs font-semibold text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/35 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                  >
                    Apply to Add Product Draft
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
