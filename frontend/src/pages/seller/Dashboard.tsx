import { motion } from "motion/react"
import { Link } from "react-router"
import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Clock,
  DollarSign
} from "lucide-react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts"
import { formatCurrency } from "@/lib/utils"
import { ORDER_STATUSES } from "@/utils/constants"

const stats = [
  {
    title: "Total Revenue",
    value: "₹20,45,680",
    change: "+12.5%",
    isPositive: true,
    icon: DollarSign,
    color: "from-purple-500 to-indigo-500"
  },
  {
    title: "Total Orders",
    value: "1,234",
    change: "+8.2%",
    isPositive: true,
    icon: ShoppingCart,
    color: "from-blue-500 to-cyan-500"
  },
  {
    title: "Total Products",
    value: "89",
    change: "+2.4%",
    isPositive: true,
    icon: Package,
    color: "from-teal-500 to-emerald-500"
  },
  {
    title: "Low Stock Items",
    value: "5",
    change: "-1.5%",
    isPositive: false,
    icon: AlertTriangle,
    color: "from-red-500 to-orange-500"
  }
]

const chartData = [
  { month: "Jan", revenue: 4000 },
  { month: "Feb", revenue: 5000 },
  { month: "Mar", revenue: 4800 },
  { month: "Apr", revenue: 6000 },
  { month: "May", revenue: 7500 },
  { month: "Jun", revenue: 9000 },
  { month: "Jul", revenue: 8500 },
  { month: "Aug", revenue: 9500 },
  { month: "Sep", revenue: 11000 },
  { month: "Oct", revenue: 12500 },
  { month: "Nov", revenue: 14000 },
  { month: "Dec", revenue: 16500 }
]

const recentOrders = [
  { id: "ub_ord_7289", customer: "Priya Sharma", product: "Quantum Pro Headset", amount: 2999, status: "processing", date: "Today" },
  { id: "ub_ord_6122", customer: "Arjun Mehta", product: "Nebula Smart Watch", amount: 4999, status: "delivered", date: "Yesterday" },
  { id: "ub_ord_5982", customer: "Ananya Reddy", product: "Aurora Backpack", amount: 1899, status: "delivered", date: "May 25" },
  { id: "ub_ord_4123", customer: "Rohan Patel", product: "Prism Desk Lamp", amount: 1299, status: "shipped", date: "May 24" },
  { id: "ub_ord_3290", customer: "Kavya Singh", product: "Obsidian Drip Brewer", amount: 899, status: "pending", date: "May 22" }
]

const topProducts = [
  { name: "Quantum Pro Headphones", sales: 245, revenue: 85747.55, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80" },
  { name: "Nebula Smart Watch Ultra", sales: 189, revenue: 113398.11, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80" },
  { name: "Aurora Designer Backpack", sales: 156, revenue: 29638.44, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=100&q=80" },
  { name: "Prism LED Desk Lamp", sales: 142, revenue: 18458.58, image: "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=100&q=80" }
]

const activityTimeline = [
  { text: "New order received from Priya Sharma for ₹2,999", time: "2 min ago", type: "order" },
  { text: "Stock levels low for Prism LED Smart Desk Lamp (4 remaining)", time: "1 hour ago", type: "alert" },
  { text: "Payout of ₹3,82,400 completed successfully", time: "4 hours ago", type: "payout" },
  { text: "Product 'Aurora Designer Backpack' updated by seller admin", time: "1 day ago", type: "update" }
]

export default function Dashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-8 font-sans"
    >
      {/* Page Title */}
      <div>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-surface-50">Dashboard</h1>
        <p className="text-xs text-surface-400 mt-0.5">Welcome back! Review your store statistics and recent orders.</p>
      </div>

      {/* Grid of Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-5 rounded-2xl glass border border-surface-800/40 shadow-md relative overflow-hidden flex flex-col justify-between hover:scale-[1.01] hover:border-primary-500/25 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-surface-450 font-semibold">{stat.title}</span>
                <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${stat.color} text-white shadow-md glow-sm group-hover:scale-105 transition-transform`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-xl font-bold tracking-tight text-surface-100">{stat.value}</p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5 ${
                    stat.isPositive
                      ? "text-green-400 bg-green-400/10 border border-green-500/20"
                      : "text-red-400 bg-red-400/10 border border-red-500/20"
                  }`}
                >
                  {stat.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {stat.change}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Main Revenue Chart */}
      <div className="rounded-2xl glass border border-surface-800/40 p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-sm text-surface-150">Revenue Over Time</h3>
            <p className="text-[10px] text-surface-450 mt-0.5">Estimated earnings from past 12 months</p>
          </div>
        </div>

        <div className="h-72 w-full pr-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                stroke="#6B7280"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#6B7280"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(20, 20, 25, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontFamily: "var(--font-sans)",
                  color: "#F3F4F6",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                }}
                formatter={(value: any) => [formatCurrency(value), "Revenue"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#8B5CF6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#chartGlow)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two columns: Recent Orders and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders (left, wider) */}
        <div className="lg:col-span-8 rounded-2xl glass border border-surface-800/40 p-6 shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-center pb-4 border-b border-surface-800/20">
            <div>
              <h3 className="font-display font-semibold text-sm text-surface-150">Recent Orders</h3>
              <p className="text-[10px] text-surface-450 mt-0.5">List of newest transactions</p>
            </div>
            <Link
              to="/seller/orders"
              className="text-[10px] font-bold text-primary-400 hover:text-primary-350 flex items-center gap-0.5 group"
            >
              Manage Orders
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-800/30 text-surface-450 uppercase text-[9px] font-bold tracking-wider">
                  <th className="pb-3 pl-2">Order ID</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Product</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3 pr-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/20 text-surface-200">
                {recentOrders.map((ord) => {
                  const statusInfo = ORDER_STATUSES[ord.status as keyof typeof ORDER_STATUSES]
                  return (
                    <tr key={ord.id} className="hover:bg-surface-800/10 transition-colors">
                      <td className="py-3.5 pl-2 font-bold font-mono">{ord.id}</td>
                      <td className="py-3.5 font-medium">{ord.customer}</td>
                      <td className="py-3.5 text-surface-350">{ord.product}</td>
                      <td className="py-3.5 font-semibold text-primary-400">{formatCurrency(ord.amount)}</td>
                      <td className="py-3.5 pr-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusInfo?.color}`}>
                          {statusInfo?.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="lg:col-span-4 rounded-2xl glass border border-surface-800/40 p-6 shadow-md space-y-4">
          <div>
            <h3 className="font-display font-semibold text-sm text-surface-150">Top Selling Products</h3>
            <p className="text-[10px] text-surface-450 mt-0.5">Most purchased items by customers</p>
          </div>

          <div className="divide-y divide-surface-800/20">
            {topProducts.map((p) => (
              <div key={p.name} className="flex gap-3 py-3.5 first:pt-0 last:pb-0">
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-surface-800/40 bg-surface-900/30 flex-shrink-0">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <h4 className="text-xs font-semibold text-surface-200 line-clamp-1 pr-6 leading-tight">
                    {p.name}
                  </h4>
                  <div className="flex justify-between items-center text-[10px] text-surface-450 mt-1">
                    <span>{p.sales} Sales</span>
                    <span className="font-semibold text-primary-400">{formatCurrency(p.revenue)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Timeline (bottom) */}
      <div className="rounded-2xl glass border border-surface-800/40 p-6 shadow-md space-y-4">
        <div>
          <h3 className="font-display font-semibold text-sm text-surface-150">System Logs / Recent Activity</h3>
          <p className="text-[10px] text-surface-450 mt-0.5">Timeline log of events happening in your store</p>
        </div>

        <div className="relative border-l border-surface-800 pl-4 space-y-5 py-2">
          {activityTimeline.map((item, idx) => (
            <div key={idx} className="relative text-xs">
              <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary-500 ring-4 ring-surface-950" />
              <div className="flex justify-between gap-4 font-sans">
                <span className="text-surface-250 font-medium">{item.text}</span>
                <span className="text-[10px] text-surface-500 font-mono flex items-center gap-1 min-w-max">
                  <Clock className="w-3 h-3" />
                  {item.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
