import { Sparkles, User } from "lucide-react"
import { ProductRecommendationCard } from "./ProductRecommendationCard"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  recommendedProducts?: any[]
}

interface ChatMessageProps {
  message: Message
  onProductClick?: () => void
}

export function ChatMessage({ message, onProductClick }: ChatMessageProps) {
  const isUser = message.role === "user"

  // Basic formatter for simple markdown-like elements (*bold*, - lists, newlines)
  const formatContent = (text: string) => {
    return text.split("\n").map((line, lineIndex) => {
      let content: React.ReactNode = line

      // Bold formatter (**text** or *text*)
      const boldRegex = /\*\*(.*?)\*\*/g
      if (boldRegex.test(line)) {
        const parts = line.split(boldRegex)
        content = parts.map((part, index) => 
          index % 2 === 1 ? <strong key={index} className="font-bold text-surface-50">{part}</strong> : part
        )
      }

      // Check if bullet point
      if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
        const listContent = line.replace(/^[-•]\s*/, "")
        return (
          <li key={lineIndex} className="list-none pl-4 relative text-xs text-surface-200 mt-1 font-sans leading-relaxed">
            <span className="absolute left-0 text-primary-400 font-bold">•</span>
            {listContent}
          </li>
        )
      }

      return (
        <p key={lineIndex} className="text-xs text-surface-200 font-sans leading-relaxed min-h-[6px]">
          {content}
        </p>
      )
    })
  }

  return (
    <div className={`flex gap-3 w-full my-4 ${isUser ? "justify-end" : "justify-start"}`}>
      {/* AI Sparkles icon on left */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-500/25 to-accent-500/25 border border-primary-500/30 flex items-center justify-center text-primary-400 flex-shrink-0 shadow-lg shadow-primary-500/5">
          <Sparkles className="w-4 h-4" />
        </div>
      )}

      {/* Bubble Message Container */}
      <div className={`max-w-[78%] space-y-2.5 ${isUser ? "order-1" : "order-2"}`}>
        <div
          className={`px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md ${
            isUser
              ? "gradient-primary border-primary-500/35 rounded-tr-sm text-white"
              : "glass border-surface-800/40 rounded-tl-sm"
          }`}
        >
          <div className="space-y-1">{formatContent(message.content)}</div>
        </div>

        {/* Dynamic Product Recommendations below AI bubbles */}
        {!isUser && message.recommendedProducts && message.recommendedProducts.length > 0 && (
          <div className="grid grid-cols-1 gap-2 mt-2 w-full animate-fade-in pl-1">
            <p className="text-[10px] uppercase tracking-wider font-bold text-surface-500 pl-0.5">
              Recommended Products
            </p>
            {message.recommendedProducts.map((p, i) => (
              <ProductRecommendationCard key={p.id || i} product={p} onClick={onProductClick} />
            ))}
          </div>
        )}
      </div>

      {/* User profile avatar on right */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-surface-800/80 border border-surface-700/50 flex items-center justify-center text-surface-300 flex-shrink-0">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  )
}
