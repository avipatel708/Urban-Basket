import { Link } from "react-router"
import { motion } from "motion/react"
import {
  Cpu,
  Shirt,
  Home,
  Dumbbell,
  Sparkles,
  BookOpen,
  Gamepad2,
  Car,
  ArrowRight,
} from "lucide-react"
import { CATEGORIES } from "@/utils/constants"
import { DEMO_PRODUCTS } from "@/utils/demoData"

const ICON_MAP: Record<string, React.ReactNode> = {
  Cpu: <Cpu className="w-8 h-8" />,
  Shirt: <Shirt className="w-8 h-8" />,
  Home: <Home className="w-8 h-8" />,
  Dumbbell: <Dumbbell className="w-8 h-8" />,
  Sparkles: <Sparkles className="w-8 h-8" />,
  BookOpen: <BookOpen className="w-8 h-8" />,
  Gamepad2: <Gamepad2 className="w-8 h-8" />,
  Car: <Car className="w-8 h-8" />,
}

// Count products per category from demo data
function getProductCount(categoryId: string): number {
  return DEMO_PRODUCTS.filter((p) => p.category === categoryId).length
}

// Category gradient colors for variety
const CATEGORY_GRADIENTS = [
  "from-violet-500/20 to-purple-600/20",
  "from-blue-500/20 to-cyan-500/20",
  "from-amber-500/20 to-orange-500/20",
  "from-emerald-500/20 to-teal-500/20",
  "from-pink-500/20 to-rose-500/20",
  "from-indigo-500/20 to-blue-500/20",
  "from-fuchsia-500/20 to-purple-500/20",
  "from-red-500/20 to-orange-500/20",
]

const CATEGORY_BORDER_COLORS = [
  "hover:border-violet-500/40",
  "hover:border-blue-500/40",
  "hover:border-amber-500/40",
  "hover:border-emerald-500/40",
  "hover:border-pink-500/40",
  "hover:border-indigo-500/40",
  "hover:border-fuchsia-500/40",
  "hover:border-red-500/40",
]

const CATEGORY_ICON_COLORS = [
  "text-violet-400",
  "text-blue-400",
  "text-amber-400",
  "text-emerald-400",
  "text-pink-400",
  "text-indigo-400",
  "text-fuchsia-400",
  "text-red-400",
]

const CATEGORY_GLOW_COLORS = [
  "group-hover:shadow-[0_0_40px_rgba(139,92,246,0.15)]",
  "group-hover:shadow-[0_0_40px_rgba(59,130,246,0.15)]",
  "group-hover:shadow-[0_0_40px_rgba(245,158,11,0.15)]",
  "group-hover:shadow-[0_0_40px_rgba(16,185,129,0.15)]",
  "group-hover:shadow-[0_0_40px_rgba(236,72,153,0.15)]",
  "group-hover:shadow-[0_0_40px_rgba(99,102,241,0.15)]",
  "group-hover:shadow-[0_0_40px_rgba(217,70,239,0.15)]",
  "group-hover:shadow-[0_0_40px_rgba(239,68,68,0.15)]",
]

export default function Categories() {
  return (
    <div className="min-h-screen gradient-bg pt-28 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-surface-100 mb-4">
            Shop by{" "}
            <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              Category
            </span>
          </h1>
          <p className="text-surface-400 font-sans text-base md:text-lg max-w-2xl mx-auto">
            Browse our curated collections across all categories. Find exactly what you're looking for.
          </p>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {CATEGORIES.map((category, index) => {
            const productCount = getProductCount(category.id)
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                  delay: index * 0.07,
                }}
              >
                <Link
                  to={`/products?category=${category.id}`}
                  className={`group relative flex flex-col items-center justify-center gap-5 p-8 rounded-2xl glass border border-surface-800/40 ${CATEGORY_BORDER_COLORS[index]} transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] ${CATEGORY_GLOW_COLORS[index]} h-full`}
                >
                  {/* Gradient orb background */}
                  <div
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${CATEGORY_GRADIENTS[index]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />

                  {/* Icon */}
                  <div
                    className={`relative z-10 p-4 rounded-2xl glass-light border border-surface-700/30 group-hover:border-primary-500/30 transition-all duration-300 ${CATEGORY_ICON_COLORS[index]}`}
                  >
                    {ICON_MAP[category.icon] || <Cpu className="w-8 h-8" />}
                  </div>

                  {/* Name & Count */}
                  <div className="relative z-10 text-center">
                    <h3 className="font-sans font-semibold text-lg text-surface-100 group-hover:text-primary-300 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-surface-500 font-sans mt-1">
                      {productCount} {productCount === 1 ? "product" : "products"}
                    </p>
                  </div>

                  {/* Explore arrow */}
                  <div className="relative z-10 flex items-center gap-1.5 text-xs font-semibold text-surface-500 group-hover:text-primary-400 transition-colors">
                    Explore
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center mt-16"
        >
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full gradient-primary text-sm font-sans font-semibold text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            View All Products
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
