import { motion } from "motion/react"
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, LineChart, Line } from "recharts"
import { DollarSign, Award, Percent, ShoppingBag, ArrowUpRight, TrendingUp } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

const stats = [
  { label: "Avg. Order Value", value: "$205.15", change: "+4.2%", isPositive: true, icon: DollarSign },
  { label: "Conversion Rate", value: "3.4%", change: "+0.8%", isPositive: true, icon: Percent },
  { label: "Return Rate", value: "1.2%", change: "-0.5%", isPositive: false, icon: Award },
  { label: "Satisfaction", value: "4.8 / 5", change: "+0.1", isPositive: true, icon: ShoppingBag }
]

const revenueData = [
  { name: "Jan", revenue: 4000 },
  { name: "Feb", revenue: 5000 },
  { name: "Mar", revenue: 4800 },
  { name: "Apr", revenue: 6000 },
  { name: "May", revenue: 7500 },
  { name: "Jun", revenue: 9000 },
  { name: "Jul", revenue: 8500 },
  { name: "Aug", revenue: 9500 },
  { name: "Sep", revenue: 11000 },
  { name: "Oct", revenue: 12500 },
  { name: "Nov", revenue: 14000 },
  { name: "Dec", revenue: 16500 }
]

const categoryData = [
  { name: "Electronics", value: 45000, color: "#8B5CF6" },
  { name: "Fashion", value: 25000, color: "#3B82F6" },
  { name: "Home & Living", value: 18000, color: "#6D28D9" },
  { name: "Sports", value: 12000, color: "#2563EB" },
  { name: "Beauty", value: 9000, color: "#A78BFA" }
]

const customerAcquisition = [
  { name: "Jan", new: 200, returning: 100 },
  { name: "Feb", new: 250, returning: 120 },
  { name: "Mar", new: 300, returning: 150 },
  { name: "Apr", new: 350, returning: 180 },
  { name: "May", new: 450, returning: 220 },
  { name: "Jun", new: 500, returning: 280 }
]

export default function Analytics() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-8 font-sans"
    >
      {/* Title */}
      <div>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-surface-50">Analytics</h1>
        <p className="text-xs text-surface-400 mt-0.5">Explore detailed reporting, chart logs, and growth statistics.</p>
      </div>

      {/* Grid Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-5 rounded-2xl glass border border-surface-800/40 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-surface-450 font-semibold">{stat.label}</span>
                <Icon className="w-4 h-4 text-primary-400" />
              </div>
              <div className="mt-4 flex items-end justify-between">
                <p className="text-lg font-bold text-surface-100 tracking-tight">{stat.value}</p>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    stat.isPositive
                      ? "text-green-400 bg-green-400/10 border border-green-500/20"
                      : "text-red-400 bg-red-400/10 border border-red-500/20"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Main Charts grid (2 cols desktop, 1 col mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue AreaChart */}
        <div className="rounded-2xl glass border border-surface-800/40 p-6 shadow-md space-y-4">
          <h3 className="font-display font-semibold text-sm text-surface-150 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-primary-400" />
            Revenue Over Time
          </h3>
          <div className="h-64 pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="glow-purple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(20, 20, 25, 0.85)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "12px",
                    color: "#F3F4F6",
                    fontSize: "11px"
                  }}
                  formatter={(value: any) => [formatCurrency(value), "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#glow-purple)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Acquisition LineChart */}
        <div className="rounded-2xl glass border border-surface-800/40 p-6 shadow-md space-y-4">
          <h3 className="font-display font-semibold text-sm text-surface-150 flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-accent-400" />
            Customer Acquisition
          </h3>
          <div className="h-64 pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={customerAcquisition}>
                <XAxis dataKey="name" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(20, 20, 25, 0.85)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "12px",
                    color: "#F3F4F6",
                    fontSize: "11px"
                  }}
                />
                <Line type="monotone" dataKey="new" stroke="#8B5CF6" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="returning" stroke="#3B82F6" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category PieChart */}
        <div className="rounded-2xl glass border border-surface-800/40 p-6 shadow-md space-y-4">
          <h3 className="font-display font-semibold text-sm text-surface-150">Sales by Category</h3>
          <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="w-full sm:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "rgba(20, 20, 25, 0.85)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "12px",
                      color: "#F3F4F6",
                      fontSize: "11px"
                    }}
                    formatter={(value: any) => [formatCurrency(value), "Sales"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 w-full sm:w-1/2">
              {categoryData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between text-xs font-sans">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-surface-300 font-medium">{entry.name}</span>
                  </div>
                  <span className="font-semibold text-surface-200">{formatCurrency(entry.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sales BarChart */}
        <div className="rounded-2xl glass border border-surface-800/40 p-6 shadow-md space-y-4">
          <h3 className="font-display font-semibold text-sm text-surface-150">Revenue Categories</h3>
          <div className="h-64 pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <XAxis dataKey="name" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(20, 20, 25, 0.85)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "12px",
                    color: "#F3F4F6",
                    fontSize: "11px"
                  }}
                  formatter={(value: any) => [formatCurrency(value), "Sales"]}
                />
                <Bar dataKey="value" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
