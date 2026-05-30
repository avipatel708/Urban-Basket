import { randomBytes } from "crypto"
import {
  addWalletMoney,
  getWalletBalance,
  getRecentTransactions,
  detectWalletStorageMode,
} from "../services/walletService.js"

const VALID_METHODS = new Set(["gpay", "upi", "card"])
const UPI_REGEX = /^[\w.-]+@[\w.-]+$|^[a-zA-Z0-9._-]{2,256}$/

function generateTransactionId(prefix = "UB") {
  return `${prefix}_${Date.now()}_${randomBytes(4).toString("hex").toUpperCase()}`
}

export const getWallet = async (req, res, next) => {
  try {
    await detectWalletStorageMode()
    const userId = req.user.id
    const balance = await getWalletBalance(userId)
    const transactions = await getRecentTransactions(userId, 8)
    return res.status(200).json({ balance, transactions })
  } catch (err) {
    next(err)
  }
}

export const topUpWallet = async (req, res, next) => {
  try {
    const { amount } = req.body
    const result = await addWalletMoney(req.user.id, amount, "wallet_topup")
    return res.status(200).json({
      message: "Money added to Urban-Basket Wallet successfully.",
      balance: result.balance,
    })
  } catch (err) {
    if (err.message?.includes("Insufficient") || err.message?.includes("Amount")) {
      return res.status(400).json({ error: err.message })
    }
    next(err)
  }
}

export const simulatePayment = async (req, res, next) => {
  try {
    const { method, amount, upiId, cardNumber } = req.body

    if (!VALID_METHODS.has(method)) {
      return res.status(400).json({ error: "Invalid payment method for simulation." })
    }

    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ error: "Invalid payment amount." })
    }

    if (method === "upi" || method === "gpay") {
      const id = (upiId || "").trim()
      if (!id || id.length < 3) {
        return res.status(400).json({ error: "Please enter a valid UPI ID." })
      }
      if (!UPI_REGEX.test(id)) {
        return res.status(400).json({ error: "UPI ID format is invalid. Example: name@upi" })
      }
    }

    if (method === "card") {
      const digits = (cardNumber || "").replace(/\D/g, "")
      if (digits.length < 13 || digits.length > 19) {
        return res.status(400).json({ error: "Invalid card number." })
      }
    }

    // Demo: simulated gateway success (production would call Razorpay/Stripe here)
    const transaction_id = generateTransactionId(method.toUpperCase())

    return res.status(200).json({
      success: true,
      payment_status: "paid",
      transaction_id,
      message: "Payment processed successfully.",
    })
  } catch (err) {
    next(err)
  }
}
