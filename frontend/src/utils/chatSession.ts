import type { Message } from "@/components/ai/ChatMessage"

const SESSION_KEY = "urban_basket_chat_messages"
const TIMESTAMP_KEY = "urban_basket_chat_timestamp"
const EXPIRY_TIME_MS = 15 * 60 * 1000 // 15 minutes

/**
 * Saves the current chat messages to local storage and updates the session timestamp.
 * @param messages 
 */
export function saveChatSession(messages: Message[]): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(messages))
    localStorage.setItem(TIMESTAMP_KEY, Date.now().toString())
  } catch (err) {
    console.error("Failed to save chat session:", err)
  }
}

/**
 * Loads the active chat messages if the session has not expired (within 15 minutes).
 * Clears and returns an empty array if expired.
 * @returns Array of active messages
 */
export function loadChatSession(): Message[] {
  try {
    const timestampStr = localStorage.getItem(TIMESTAMP_KEY)
    if (!timestampStr) return []

    const lastActivity = parseInt(timestampStr, 10)
    const now = Date.now()

    if (now - lastActivity > EXPIRY_TIME_MS) {
      clearExpiredSession()
      return []
    }

    const messagesStr = localStorage.getItem(SESSION_KEY)
    return messagesStr ? JSON.parse(messagesStr) : []
  } catch (err) {
    console.error("Failed to load chat session:", err)
    return []
  }
}

/**
 * Safely removes session-related items from storage.
 */
export function clearExpiredSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(TIMESTAMP_KEY)
  } catch (err) {
    console.error("Failed to clear chat session:", err)
  }
}
