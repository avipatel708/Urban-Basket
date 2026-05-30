import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { MessageSquare, X, Send, Sparkles, Flame, HelpCircle, Package, Laptop } from "lucide-react"
import { ChatMessage } from "./ChatMessage"
import type { Message } from "./ChatMessage"
import { chatWithAI } from "@/services/aiService"
import { generateId } from "@/lib/utils"
import { toast } from "sonner"
import { loadChatSession, saveChatSession } from "@/utils/chatSession"

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(() => loadChatSession())
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  // Save session messages to storage on updates
  useEffect(() => {
    saveChatSession(messages)
  }, [messages])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom whenever messages or typing state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

  const handleSend = async (text: string) => {
    if (!text.trim()) return

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: text.trim()
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    try {
      const historyPayload = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
      const response = await chatWithAI(text, historyPayload)
      
      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: response.text,
        recommendedProducts: response.recommendedProducts
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err: any) {
      toast.error("Failed to compile AI response.")
      const errorMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "🚨 **System Error**: I encountered a data transmission failure. Let me try again."
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleStarterPrompt = (prompt: string) => {
    handleSend(prompt)
  }

  return (
    <div className="relative">
      {/* Floating Chat Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full gradient-primary text-white flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.4)] border border-primary-400/30 hover:shadow-[0_0_40px_rgba(139,92,246,0.6)] transition-all cursor-pointer relative"
        aria-label="Toggle Chatbot"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <MessageSquare className="w-6 h-6" />
              {/* Pulsing indicator */}
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-accent-500 border border-white/20"></span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Glassmorphic Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="absolute bottom-20 right-0 w-[380px] sm:w-[410px] h-[550px] rounded-3xl glass-strong border border-surface-850 shadow-[0_15px_50px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden backdrop-blur-2xl"
          >
            {/* Header bar */}
            <div className="p-4 border-b border-surface-800/40 bg-surface-950/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-500 to-accent-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-surface-50 flex items-center gap-1.5">
                    Cyber Assistant
                    <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                  </h3>
                  <p className="text-[10px] text-surface-450 mt-0.5 font-semibold">Ask anything • Online</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full glass-light border border-surface-800 text-surface-450 hover:text-surface-150 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Body Streams */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.length === 0 ? (
                /* Welcome Screen with Prompts */
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="h-full flex flex-col justify-center items-center text-center px-4 space-y-6 pt-4"
                >
                  <div className="space-y-2">
                    <h4 className="font-display font-bold text-base text-surface-100">
                      Welcome to{" "}
                      <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                        Urban-Basket AI
                      </span>
                    </h4>
                    <p className="text-xs text-surface-400 font-sans leading-relaxed">
                      I am your high-fidelity, autonomous shopping companion. Ask me to locate electronics, check active discounts, or track recent shipping orders!
                    </p>
                  </div>

                  {/* Starter prompt cards */}
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <button
                      onClick={() => handleStarterPrompt("Recommend gaming products")}
                      className="flex flex-col items-center gap-2 p-3.5 rounded-2xl glass border border-surface-800/40 hover:border-primary-500/30 text-left hover:bg-surface-800/10 transition-all text-xs font-semibold cursor-pointer group"
                    >
                      <Laptop className="w-5 h-5 text-primary-400 group-hover:scale-105 transition-transform" />
                      <span className="text-[10px] text-surface-250 text-center font-sans">Gaming Products</span>
                    </button>
                    <button
                      onClick={() => handleStarterPrompt("Track my order")}
                      className="flex flex-col items-center gap-2 p-3.5 rounded-2xl glass border border-surface-800/40 hover:border-primary-500/30 text-left hover:bg-surface-800/10 transition-all text-xs font-semibold cursor-pointer group"
                    >
                      <Package className="w-5 h-5 text-accent-400 group-hover:scale-105 transition-transform" />
                      <span className="text-[10px] text-surface-250 text-center font-sans">Track Purchases</span>
                    </button>
                    <button
                      onClick={() => handleStarterPrompt("Return Policy FAQ")}
                      className="flex flex-col items-center gap-2 p-3.5 rounded-2xl glass border border-surface-800/40 hover:border-primary-500/30 text-left hover:bg-surface-800/10 transition-all text-xs font-semibold cursor-pointer group"
                    >
                      <HelpCircle className="w-5 h-5 text-emerald-400 group-hover:scale-105 transition-transform" />
                      <span className="text-[10px] text-surface-250 text-center font-sans">Return & Refunds</span>
                    </button>
                    <button
                      onClick={() => handleStarterPrompt("Locate hot deals")}
                      className="flex flex-col items-center gap-2 p-3.5 rounded-2xl glass border border-surface-800/40 hover:border-primary-500/30 text-left hover:bg-surface-800/10 transition-all text-xs font-semibold cursor-pointer group"
                    >
                      <Flame className="w-5 h-5 text-red-400 group-hover:scale-105 transition-transform" />
                      <span className="text-[10px] text-surface-250 text-center font-sans">Browse Hot Deals</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* Chat logs list */
                messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} onProductClick={() => setIsOpen(false)} />
                ))
              )}

              {/* Bouncing Loader */}
              {isTyping && (
                <div className="flex gap-3 justify-start items-center">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-500/20 to-accent-500/20 flex items-center justify-center text-primary-400">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl glass border border-surface-800/40 rounded-tl-sm flex items-center gap-2 shadow-lg">
                    <span className="text-[10px] font-sans font-semibold text-surface-450 tracking-wide animate-pulse">
                      Analyzing data models...
                    </span>
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat inputs footer */}
            <div className="p-4 border-t border-surface-800/40 bg-surface-950/20">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSend(input)
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask me something..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 glass-light border border-surface-800/50 rounded-2xl py-2.5 px-4 text-xs focus:outline-none focus:border-primary-500 text-surface-100"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="p-2.5 rounded-2xl gradient-primary text-white shadow-md shadow-primary-500/10 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer flex-shrink-0"
                  aria-label="Send query"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
