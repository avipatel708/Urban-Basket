import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import { randomUUID } from "crypto"
import { supabaseAdmin } from "../config/supabase.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, "..", "data")
const WALLETS_FILE = path.join(DATA_DIR, "wallets.json")
const WALLET_TX_FILE = path.join(DATA_DIR, "wallet-transactions.json")

let storageMode = null

async function readJsonFile(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8")
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

async function writeJsonFile(filePath, data) {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8")
}

export async function detectWalletStorageMode() {
  if (storageMode) return storageMode

  const { error } = await supabaseAdmin.from("wallets").select("id").limit(1)
  storageMode = error ? "file" : "database"

  if (storageMode === "file") {
    console.warn("⚠️  Wallet tables not found — using local file storage for wallets.")
    console.warn("   Run backend/migrations/payment-wallet.sql in Supabase SQL Editor.")
    await ensureFileStorage()
  }

  return storageMode
}

async function ensureFileStorage() {
  await fs.mkdir(DATA_DIR, { recursive: true })
  const wallets = await readJsonFile(WALLETS_FILE, null)
  if (!wallets) await writeJsonFile(WALLETS_FILE, {})
  const txs = await readJsonFile(WALLET_TX_FILE, null)
  if (!txs) await writeJsonFile(WALLET_TX_FILE, [])
}

async function getFileWallet(userId) {
  const wallets = await readJsonFile(WALLETS_FILE, {})
  if (!wallets[userId]) {
    wallets[userId] = { balance: 0, updated_at: new Date().toISOString() }
    await writeJsonFile(WALLETS_FILE, wallets)
  }
  return wallets[userId]
}

async function saveFileWallet(userId, data) {
  const wallets = await readJsonFile(WALLETS_FILE, {})
  wallets[userId] = { ...data, updated_at: new Date().toISOString() }
  await writeJsonFile(WALLETS_FILE, wallets)
}

async function addFileTransaction(userId, type, amount, status, reference) {
  const txs = await readJsonFile(WALLET_TX_FILE, [])
  txs.unshift({
    id: randomUUID(),
    user_id: userId,
    type,
    amount,
    status,
    reference: reference || null,
    created_at: new Date().toISOString(),
  })
  await writeJsonFile(WALLET_TX_FILE, txs.slice(0, 500))
}

export async function getWalletBalance(userId) {
  await detectWalletStorageMode()

  if (storageMode === "file") {
    const w = await getFileWallet(userId)
    return parseFloat(w.balance) || 0
  }

  const { data, error } = await supabaseAdmin
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) {
    const { data: created, error: createError } = await supabaseAdmin
      .from("wallets")
      .insert({ user_id: userId, balance: 0 })
      .select("balance")
      .single()
    if (createError) throw new Error(createError.message)
    return parseFloat(created.balance) || 0
  }

  return parseFloat(data.balance) || 0
}

export async function addWalletMoney(userId, amount, reference = "topup") {
  const amt = parseFloat(amount)
  if (!amt || amt <= 0) throw new Error("Amount must be greater than zero.")
  if (amt > 100000) throw new Error("Maximum top-up per transaction is ₹1,00,000.")

  await detectWalletStorageMode()

  if (storageMode === "file") {
    const w = await getFileWallet(userId)
    w.balance = (parseFloat(w.balance) || 0) + amt
    await saveFileWallet(userId, w)
    await addFileTransaction(userId, "credit", amt, "completed", reference)
    return { balance: w.balance }
  }

  let balance = await getWalletBalance(userId)
  balance += amt

  const { error: updateError } = await supabaseAdmin
    .from("wallets")
    .update({ balance, updated_at: new Date().toISOString() })
    .eq("user_id", userId)

  if (updateError) throw new Error(updateError.message)

  await supabaseAdmin.from("wallet_transactions").insert({
    user_id: userId,
    type: "credit",
    amount: amt,
    status: "completed",
    reference,
  })

  return { balance }
}

export async function deductWallet(userId, amount, reference = "order") {
  const amt = parseFloat(amount)
  if (!amt || amt <= 0) throw new Error("Invalid deduction amount.")

  const balance = await getWalletBalance(userId)
  if (balance < amt) {
    throw new Error(`Insufficient wallet balance. Available: ₹${balance.toFixed(2)}`)
  }

  await detectWalletStorageMode()

  if (storageMode === "file") {
    const w = await getFileWallet(userId)
    w.balance = Math.max(0, (parseFloat(w.balance) || 0) - amt)
    await saveFileWallet(userId, w)
    await addFileTransaction(userId, "debit", amt, "completed", reference)
    return { balance: w.balance }
  }

  const newBalance = balance - amt
  const { error: updateError } = await supabaseAdmin
    .from("wallets")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("user_id", userId)

  if (updateError) throw new Error(updateError.message)

  await supabaseAdmin.from("wallet_transactions").insert({
    user_id: userId,
    type: "debit",
    amount: amt,
    status: "completed",
    reference,
  })

  return { balance: newBalance }
}

export async function getRecentTransactions(userId, limit = 10) {
  await detectWalletStorageMode()

  if (storageMode === "file") {
    const txs = await readJsonFile(WALLET_TX_FILE, [])
    return txs.filter((t) => t.user_id === userId).slice(0, limit)
  }

  const { data, error } = await supabaseAdmin
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data || []
}
