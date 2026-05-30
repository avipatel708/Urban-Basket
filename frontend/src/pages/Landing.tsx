import { useState, useEffect } from "react"
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
  TrendingUp,
  Award,
  Zap,
  ShoppingBag,
  Gift,
} from "lucide-react"
import { LandingMysterySection } from "@/components/mystery/LandingMysterySection"
import { ProductCard } from "@/components/product/ProductCard"
import { DEMO_PRODUCTS, DEMO_TESTIMONIALS } from "@/utils/demoData"
import { CATEGORIES } from "@/utils/constants"
import { getProducts } from "@/services/productService"
import type { Product } from "@/services/productService"

// Map category icons manually
const categoryIcons: Record<string, any> = {
  Cpu,
  Shirt,
  Home,
  Dumbbell,
  Sparkles,
  BookOpen,
  Gamepad2,
  Car,
}

export default function Landing() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])

  useEffect(() => {
    async function loadFeatured() {
      try {
        const res = await getProducts({ featured: true, limit: 4 })
        if (res && res.data && res.data.length > 0) {
          setFeaturedProducts(res.data)
        } else {
          // fallback to demo products if database has no featured ones
          setFeaturedProducts(DEMO_PRODUCTS.filter((p) => p.is_featured).slice(0, 4))
        }
      } catch (err) {
        console.error("Failed to load featured products:", err)
        setFeaturedProducts(DEMO_PRODUCTS.filter((p) => p.is_featured).slice(0, 4))
      }
    }
    loadFeatured()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-24 pb-12 overflow-hidden"
    >
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center pt-8">
        {/* Animated Gradient Orbs in Background */}
        <div className="absolute top-1/4 left-1/10 w-72 h-72 rounded-full bg-primary-500/10 blur-[100px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/10 w-96 h-96 rounded-full bg-accent-500/10 blur-[120px] animate-pulse pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Hero Text */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-light border border-primary-500/20 text-xs font-semibold text-primary-300 backdrop-blur-md mb-2"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Next-Gen E-Commerce Platform</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-surface-50"
            >
              The Future of <br className="hidden sm:inline" />
              <span className="gradient-text">Shopping</span> is Here
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-base sm:text-lg text-surface-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans"
            >
              Step into an immersive, premium marketplace. Discover futuristic design, curated premium collections, and ultra-secure transactions built for the modern consumer.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-4"
            >
              <Link
                to="/products"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full gradient-primary text-sm font-sans font-bold text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.03] transition-all cursor-pointer animate-glow-pulse"
              >
                Explore Products
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/mystery"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-gradient-to-r from-amber-500 to-primary-500 border border-amber-400/30 text-sm font-sans font-bold text-white shadow-lg shadow-amber-500/25 hover:scale-[1.03] transition-all cursor-pointer"
              >
                <Gift className="w-4 h-4" />
                Mystery Boxes
              </Link>
              <Link
                to="/signup?role=seller"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full glass border border-surface-700/60 text-sm font-sans font-semibold text-surface-200 hover:border-primary-500 hover:text-primary-300 hover:scale-[1.03] transition-all cursor-pointer"
              >
                Become a Seller
              </Link>
            </motion.div>
          </div>

          {/* Floating Visual Cards */}
          <div className="lg:col-span-5 hidden lg:flex justify-center relative">
            <div className="w-80 h-96 relative flex items-center justify-center">
              {/* Card 1 */}
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="w-64 h-80 rounded-2xl glass p-6 border border-surface-800/40 absolute -left-12 -top-6 glow-sm shadow-2xl flex flex-col justify-between"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white glow-sm">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-display font-bold text-sm text-surface-200">Realtime Analytics</h4>
                  <p className="text-xs text-surface-400 leading-relaxed">
                    Track your business earnings, sales, and audience insights in realtime.
                  </p>
                </div>
                <span className="text-[10px] font-bold tracking-wider text-primary-400 uppercase">
                  For Sellers
                </span>
              </motion.div>

              {/* Card 2 */}
              <motion.div
                animate={{ y: [0, 15, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 0.5 }}
                className="w-64 h-80 rounded-2xl glass p-6 border border-surface-800/40 absolute -right-6 -bottom-6 glow-sm shadow-2xl flex flex-col justify-between"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white glow-sm">
                  <Award className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-display font-bold text-sm text-surface-200">Premium Curations</h4>
                  <p className="text-xs text-surface-400 leading-relaxed">
                    Browse handpicked items from top-tier brands and individual creators.
                  </p>
                </div>
                <span className="text-[10px] font-bold tracking-wider text-accent-400 uppercase">
                  For Customers
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Mystery Boxes — home showcase */}
      <LandingMysterySection />

      {/* 2. CATEGORIES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-surface-50">
            Shop by <span className="gradient-text">Category</span>
          </h2>
          <p className="text-sm text-surface-400 max-w-md mx-auto font-sans leading-relaxed">
            Quickly navigate our collections to find exactly what fits your digital lifestyle.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {CATEGORIES.map((category, index) => {
            const Icon = categoryIcons[category.icon] || Cpu
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.04 }}
              >
                <Link
                  to={`/products?category=${category.id}`}
                  className="group block p-5 rounded-2xl glass border border-surface-800/40 hover:border-primary-500/30 hover:scale-102 hover:shadow-[0_0_20px_rgba(139,92,246,0.1)] transition-all text-center space-y-4 cursor-pointer"
                >
                  <div className="w-12 h-12 mx-auto rounded-xl glass-light border border-surface-800/40 flex items-center justify-center text-surface-300 group-hover:text-primary-400 group-hover:bg-primary-500/5 transition-all glow-sm">
                    <Icon className="w-5.5 h-5.5" />
                  </div>
                  <h3 className="font-display font-medium text-sm text-surface-200 group-hover:text-primary-300 transition-colors">
                    {category.name}
                  </h3>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left space-y-1.5">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-surface-50">
              Featured <span className="gradient-text">Drops</span>
            </h2>
            <p className="text-xs sm:text-sm text-surface-400 font-sans leading-relaxed">
              Explore outstanding gadgets and fashion handpicked for technological excellence.
            </p>
          </div>
          <Link
            to="/products"
            className="flex items-center gap-1.5 text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors cursor-pointer group"
          >
            View All Products
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {featuredProducts.map((product, idx) => (
            <ProductCard key={product.id} product={product} index={idx} />
          ))}
        </div>
      </section>

      {/* 4. TESTIMONIALS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-surface-50">
            Loved by the <span className="gradient-text">Community</span>
          </h2>
          <p className="text-sm text-surface-400 max-w-md mx-auto font-sans leading-relaxed">
            Read experience reports from professional buyers and growing sellers worldwide.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {DEMO_TESTIMONIALS.map((testimonial, idx) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="p-6 rounded-2xl glass border border-surface-800/40 flex flex-col justify-between h-full hover:shadow-[0_0_20px_rgba(59,130,246,0.05)] hover:border-accent-500/20 transition-all duration-300"
            >
              <div className="space-y-4">
                {/* Stars */}
                <div className="flex text-yellow-500">
                  {Array.from({ length: 5 }).map((_, sIdx) => (
                    <Award
                      key={sIdx}
                      className={`w-3.5 h-3.5 ${
                        sIdx < testimonial.rating ? "fill-current" : "opacity-30"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-surface-300 leading-relaxed font-sans">
                  "{testimonial.content}"
                </p>
              </div>

              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-surface-800/30">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-surface-800 flex items-center justify-center font-bold text-xs border border-surface-700/50">
                  <img src={testimonial.avatar} alt={testimonial.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-sans font-semibold text-xs text-surface-150">{testimonial.name}</h4>
                  <p className="text-[10px] text-surface-500 font-sans">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. CALL TO ACTION (CTA) BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl glass p-10 sm:p-16 border border-surface-800/50 relative overflow-hidden flex flex-col items-center text-center space-y-6 glow-md hover:shadow-[0_0_50px_rgba(139,92,246,0.25)] transition-all duration-500"
        >
          {/* Subtle orb background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary-500/5 blur-[80px] pointer-events-none" />

          <ShoppingBag className="w-12 h-12 text-primary-400 mb-2 glow-sm animate-bounce" />

          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-surface-50 max-w-2xl leading-tight">
            Start Your Premium <br className="sm:hidden" />
            <span className="gradient-text">Shopping Journey</span> Today
          </h2>

          <p className="text-sm text-surface-400 max-w-md leading-relaxed font-sans">
            Create your account now to unlock exclusive member rewards, personalized recommendations, and lightning checkout.
          </p>

          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full gradient-primary text-sm font-sans font-bold text-white shadow-xl shadow-primary-500/30 hover:scale-[1.03] transition-all cursor-pointer"
          >
            Create Your Account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>
    </motion.div>
  )
}
