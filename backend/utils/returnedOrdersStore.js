import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, "..", "data")
const RETURNS_FILE = path.join(DATA_DIR, "returned-orders.json")

async function readStore() {
  try {
    const raw = await fs.readFile(RETURNS_FILE, "utf8")
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed?.order_ids) ? parsed : { order_ids: [] }
  } catch {
    return { order_ids: [] }
  }
}

async function writeStore(store) {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(RETURNS_FILE, JSON.stringify(store, null, 2), "utf8")
}

export async function isOrderReturnedInFile(orderId) {
  const store = await readStore()
  return store.order_ids.includes(String(orderId))
}

export async function markOrderReturnedInFile(orderId) {
  const store = await readStore()
  const id = String(orderId)
  if (!store.order_ids.includes(id)) {
    store.order_ids.push(id)
    await writeStore(store)
  }
}

export async function getReturnedOrderIdsFromFile() {
  const store = await readStore()
  return new Set(store.order_ids.map(String))
}
