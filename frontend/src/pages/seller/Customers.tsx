import { motion } from "motion/react"
import { Users, UserPlus, TrendingUp, DollarSign, Search } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

const stats = [
  { label: "Total Customers", value: "450", change: "+12%", icon: Users },
  { label: "New This Month", value: "45", change: "+8%", icon: UserPlus },
  { label: "Repeat Buyers", value: "68%", change: "+2%", icon: TrendingUp },
  { label: "Average Spend", value: "$245.50", change: "+5%", icon: DollarSign }
]

const demoCustomers = [
  { name: "Sarah Chen", email: "sarah.chen@example.com", orders: 5, spent: 1749.95, lastOrder: "Today", status: "Active" },
  { name: "Marcus Rivera", email: "marcus.riv@example.com", orders: 3, spent: 919.97, lastOrder: "Yesterday", status: "Active" },
  { name: "Emily Watson", email: "emily.wat@example.com", orders: 4, spent: 859.96, lastOrder: "May 25", status: "Active" },
  { name: "David Kim", email: "david.kim@example.com", orders: 2, spent: 259.98, lastOrder: "May 24", status: "Inactive" },
  { name: "Jessica Lee", email: "jessica.l@example.com", orders: 1, spent: 89.99, lastOrder: "May 22", status: "Active" },
  { name: "Michael Chang", email: "m.chang@example.com", orders: 1, spent: 199.99, lastOrder: "May 20", status: "Inactive" }
]

export default function Customers() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-8 font-sans"
    >
      {/* Title */}
      <div>
        <h1 className="font-display font-bold text-2xl text-surface-50">Customer Overview</h1>
        <p className="text-xs text-surface-400 mt-0.5">Track user stats, ordering patterns, and average expenditures.</p>
      </div>

      {/* Grid Stats */}
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
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-green-400 bg-green-400/10 border border-green-500/20">
                  {stat.change}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Searching row */}
      <div className="p-4 rounded-2xl glass border border-surface-800/35 flex items-center justify-between gap-4">
        <div className="relative flex items-center flex-1 max-w-sm">
          <Search className="absolute left-3.5 w-4 h-4 text-surface-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search customers by name or email..."
            className="w-full glass-light border border-surface-800/50 rounded-xl py-2 pl-11 pr-4 text-xs focus:outline-none focus:border-primary-500 text-surface-200"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl glass border border-surface-800/40 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-surface-800/30 text-surface-450 uppercase text-[9px] font-bold tracking-wider bg-surface-900/10">
                <th className="py-4 pl-4">Customer Name</th>
                <th className="py-4">Orders Count</th>
                <th className="py-4">Total Spent</th>
                <th className="py-4">Last Order</th>
                <th className="py-4 pr-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/20 text-surface-200">
              {demoCustomers.map((cust) => (
                <tr key={cust.email} className="hover:bg-surface-800/10 transition-colors">
                  <td className="py-3.5 pl-4">
                    <p className="font-semibold text-surface-200">{cust.name}</p>
                    <p className="text-[10px] text-surface-500">{cust.email}</p>
                  </td>
                  <td className="py-3.5 font-semibold text-surface-350">{cust.orders} Orders</td>
                  <td className="py-3.5 font-semibold text-primary-400">{formatCurrency(cust.spent)}</td>
                  <td className="py-3.5 text-surface-450">{cust.lastOrder}</td>
                  <td className="py-3.5 pr-4 text-right">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        cust.status === "Active"
                          ? "text-green-400 bg-green-400/10 border border-green-500/20"
                          : "text-surface-400 bg-surface-800/30 border border-surface-800"
                      }`}
                    >
                      {cust.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}
