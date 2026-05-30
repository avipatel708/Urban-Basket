import { Link } from "react-router"
import { Send, Globe, MessageCircle, Users, ShieldCheck, Truck, RefreshCw, Headphones } from "lucide-react"
import { Logo } from "@/components/common/Logo"

export function Footer() {
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Newsletter registration logic placeholder
  }

  return (
    <footer className="glass border-t border-surface-800/40 relative z-10">
      {/* Top Banner / Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-b border-surface-800/30">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex items-center gap-4 p-4 rounded-xl glass-light hover:bg-surface-800/10 transition-colors">
            <div className="p-3 rounded-lg gradient-primary text-white glow-sm">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-surface-150">Free Shipping</h4>
              <p className="text-xs text-surface-400">On all orders above $100</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl glass-light hover:bg-surface-800/10 transition-colors">
            <div className="p-3 rounded-lg gradient-primary text-white glow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-surface-150">Secure Payment</h4>
              <p className="text-xs text-surface-400">100% protected checkout</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl glass-light hover:bg-surface-800/10 transition-colors">
            <div className="p-3 rounded-lg gradient-primary text-white glow-sm">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-surface-150">Easy Returns</h4>
              <p className="text-xs text-surface-400">30-day money-back guarantee</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl glass-light hover:bg-surface-800/10 transition-colors">
            <div className="p-3 rounded-lg gradient-primary text-white glow-sm">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-surface-150">24/7 Support</h4>
              <p className="text-xs text-surface-400">Dedicated assistance anytime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-6">
            <Logo size="lg" />
            <p className="text-sm text-surface-400 max-w-sm leading-relaxed">
              Step into the future of online shopping. Urban-Basket delivers a curated ecosystem of premium, state-of-the-art electronics, apparel, and lifestyle items.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full glass-light flex items-center justify-center text-surface-400 hover:text-primary-400 hover:scale-105 active:scale-95 transition-all"
              >
                <Globe className="w-4.5 h-4.5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full glass-light flex items-center justify-center text-surface-400 hover:text-primary-400 hover:scale-105 active:scale-95 transition-all"
              >
                <MessageCircle className="w-4.5 h-4.5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full glass-light flex items-center justify-center text-surface-400 hover:text-primary-400 hover:scale-105 active:scale-95 transition-all"
              >
                <Users className="w-4.5 h-4.5" />
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold text-sm text-surface-200 uppercase tracking-wider">Shop</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/products?category=electronics" className="text-sm text-surface-400 hover:text-primary-400 transition-colors">
                  Electronics
                </Link>
              </li>
              <li>
                <Link to="/products?category=fashion" className="text-sm text-surface-400 hover:text-primary-400 transition-colors">
                  Fashion & Wear
                </Link>
              </li>
              <li>
                <Link to="/products?category=home" className="text-sm text-surface-400 hover:text-primary-400 transition-colors">
                  Home & Living
                </Link>
              </li>
              <li>
                <Link to="/products?category=sports" className="text-sm text-surface-400 hover:text-primary-400 transition-colors">
                  Sports Gears
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold text-sm text-surface-200 uppercase tracking-wider">Company</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/about" className="text-sm text-surface-400 hover:text-primary-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-sm text-surface-400 hover:text-primary-400 transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm text-surface-400 hover:text-primary-400 transition-colors">
                  Press & Blog
                </Link>
              </li>
              <li>
                <Link to="/partners" className="text-sm text-surface-400 hover:text-primary-400 transition-colors">
                  Partnerships
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Col */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold text-sm text-surface-200 uppercase tracking-wider">Subscribe</h4>
            <p className="text-xs text-surface-400 leading-relaxed">
              Stay ahead. Sign up for our tech drops, private sales, and community discounts.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="relative flex items-center mt-2.5">
              <input
                type="email"
                placeholder="Enter your email"
                className="glass-light border border-surface-700/50 rounded-lg py-2 pl-3.5 pr-10 text-xs w-full focus:outline-none focus:border-primary-500 text-surface-200"
                required
              />
              <button
                type="submit"
                className="absolute right-1 gradient-primary text-white p-1.5 rounded-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-surface-800/30 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-950/20">
        <p className="text-xs text-surface-500">
          &copy; {new Date().getFullYear()} Urban-Basket Inc. All rights reserved.
        </p>
        <div className="flex gap-6">
          <Link to="/privacy" className="text-xs text-surface-500 hover:text-primary-400 transition-colors">
            Privacy Policy
          </Link>
          <Link to="/terms" className="text-xs text-surface-500 hover:text-primary-400 transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  )
}
