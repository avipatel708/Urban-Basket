import { useState, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import { Search } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ORDER_STATUSES, SELLER_SETTABLE_ORDER_STATUSES } from "@/utils/constants"
import type { OrderStatus } from "@/utils/constants"
import { getSellerOrders, updateOrderStatus, type SellerOrder } from "@/services/orderService"
import { toast } from "sonner"

const VALID_STATUSES = new Set<string>([
  "pending",
  "confirmed",
  "packed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
])

function normalizeStatus(status: string): OrderStatus {
  return VALID_STATUSES.has(status) ? (status as OrderStatus) : "pending"
}

function formatOrderDate(date: string | undefined) {
  if (!date) return "—"
  try {
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return "—"
    return formatDate(parsed)
  } catch {
    return typeof date === "string" ? date.slice(0, 10) : "—"
  }
}

function normalizeSellerOrder(raw: Partial<SellerOrder>): SellerOrder {
  return {
    id: String(raw.id ?? ""),
    customer: String(raw.customer ?? "Customer"),
    email: String(raw.email ?? ""),
    items: String(raw.items ?? ""),
    total: Number(raw.total) || 0,
    status: normalizeStatus(String(raw.status ?? "pending")),
    date: String(raw.date ?? new Date().toISOString()),
  }
}

export default function SellerOrders() {
  const [orders, setOrders] = useState<SellerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getSellerOrders()
      const list = Array.isArray(data) ? data : []
      setOrders(list.map((o) => normalizeSellerOrder(o)))
    } catch (err) {
      console.error("Failed to load seller orders:", err)
      toast.error("Failed to load orders.")
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
    const onUpdated = () => loadOrders()
    window.addEventListener("ub-seller-orders-updated", onUpdated)
    return () => window.removeEventListener("ub-seller-orders-updated", onUpdated)
  }, [loadOrders])

  const handleStatusChange = async (id: string, newStatus: OrderStatus) => {
    const previousStatus = orders.find((o) => o.id === id)?.status
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)))

    try {
      await updateOrderStatus(id, newStatus)
      toast.success(`Order status updated to ${ORDER_STATUSES[newStatus].label}`)
    } catch (err) {
      if (previousStatus) {
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: previousStatus } : o))
        )
      }
      const message = err instanceof Error ? err.message : "Failed to update order status."
      toast.error(message)
    }
  }

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase()
    const matchesSearch =
      (o.id || "").toLowerCase().includes(q) ||
      (o.customer || "").toLowerCase().includes(q) ||
      (o.email || "").toLowerCase().includes(q)
    const matchesStatus = statusFilter === "all" || o.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-8 font-sans"
    >
      <div>
        <h1 className="font-display font-bold text-2xl text-surface-50">Orders Management</h1>
        <p className="text-xs text-surface-400 mt-0.5">Track shipping status, handle cancellations, and print invoices.</p>
      </div>

      <div className="flex overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none gap-2 border-b border-surface-800/40">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-4 py-2 text-xs font-semibold font-sans border-b-2 transition-all cursor-pointer ${
            statusFilter === "all"
              ? "border-primary-500 text-primary-400"
              : "border-transparent text-surface-450 hover:text-surface-200"
          }`}
        >
          All Orders
        </button>
        {Object.entries(ORDER_STATUSES).map(([key, value]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-4 py-2 text-xs font-semibold font-sans border-b-2 capitalize transition-all cursor-pointer ${
              statusFilter === key
                ? "border-primary-500 text-primary-400"
                : "border-transparent text-surface-450 hover:text-surface-200"
            }`}
          >
            {value.label}
          </button>
        ))}
      </div>

      <div className="p-4 rounded-2xl glass border border-surface-800/35 flex items-center justify-between gap-4">
        <div className="relative flex items-center flex-1 max-w-sm">
          <Search className="absolute left-3.5 w-4 h-4 text-surface-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Order ID or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full glass-light border border-surface-800/50 rounded-xl py-2 pl-11 pr-4 text-xs focus:outline-none focus:border-primary-500 text-surface-200"
          />
        </div>

        <span className="text-[11px] text-surface-450 font-medium font-sans">
          Found {filteredOrders.length} orders
        </span>
      </div>

      <div className="rounded-2xl glass border border-surface-800/40 overflow-hidden shadow-md">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-sm text-surface-400">Loading orders…</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <h4 className="font-semibold text-surface-200">No orders found</h4>
            <p className="text-xs text-surface-450 max-w-xs mx-auto leading-relaxed">
              {orders.length === 0
                ? "When customers purchase your products, their orders will appear here."
                : "Adjust your status filters or search query to find matching orders."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-800/30 text-surface-450 uppercase text-[9px] font-bold tracking-wider bg-surface-900/10">
                  <th className="py-4 pl-4">Order ID</th>
                  <th className="py-4">Customer</th>
                  <th className="py-4">Items Summary</th>
                  <th className="py-4">Total</th>
                  <th className="py-4">Date</th>
                  <th className="py-4 pr-4 text-right">Status Selector</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/20 text-surface-200">
                {filteredOrders.map((ord) => {
                  const currentStatus = ORDER_STATUSES[ord.status] ?? ORDER_STATUSES.pending
                  const shortId = ord.id.length > 8 ? `${ord.id.slice(0, 8)}…` : ord.id || "—"
                  return (
                    <tr key={ord.id || shortId} className="hover:bg-surface-800/10 transition-colors">
                      <td className="py-3.5 pl-4 font-bold font-mono text-surface-150 text-[10px] max-w-[120px] truncate" title={ord.id}>
                        {shortId}
                      </td>
                      <td className="py-3.5">
                        <p className="font-semibold text-surface-200">{ord.customer}</p>
                        <p className="text-[10px] text-surface-500">{ord.email || "—"}</p>
                      </td>
                      <td className="py-3.5 text-surface-350 pr-4 max-w-xs truncate" title={ord.items}>
                        {ord.items || "—"}
                      </td>
                      <td className="py-3.5 font-semibold text-primary-400">{formatCurrency(ord.total)}</td>
                      <td className="py-3.5 text-surface-450">{formatOrderDate(ord.date)}</td>
                      <td className="py-3.5 pr-4 text-right">
                        {ord.status === "returned" ? (
                          <span
                            className={`inline-block text-[10px] font-bold tracking-wide border rounded-lg px-2.5 py-1 ${currentStatus.color}`}
                          >
                            Returned
                          </span>
                        ) : (
                          <select
                            value={ord.status}
                            onChange={(e) => handleStatusChange(ord.id, e.target.value as OrderStatus)}
                            disabled={!ord.id}
                            className={`text-[10px] font-bold tracking-wide border rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer bg-surface-950/80 ${currentStatus.color}`}
                          >
                            {Object.entries(SELLER_SETTABLE_ORDER_STATUSES).map(([key, val]) => (
                              <option key={key} value={key} className="bg-surface-950 text-surface-200">
                                {val.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  )
}
