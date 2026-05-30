import { useState, useEffect, useRef } from "react"
import { Link, NavLink, useNavigate } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import {
  Menu,
  X,
  ShoppingCart,
  Heart,
  Bell,
  Sun,
  Moon,
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Settings,
  ShoppingBag,
  Wallet,
} from "lucide-react"
import { WalletPanel } from "@/components/wallet/WalletPanel"
import { Logo } from "@/components/common/Logo"
import { SmartSearchBar } from "@/components/search/SmartSearchBar"
import { useAuthStore } from "@/store/authStore"
import { useCartStore } from "@/store/cartStore"
import { useWishlistStore } from "@/store/wishlistStore"
import { useThemeStore } from "@/store/themeStore"
import { useNotificationStore } from "@/store/notificationStore"
import { useNotificationSync } from "@/hooks/useNotificationSync"
import { NAV_LINKS } from "@/utils/constants"
import { useProductCacheStore } from "@/store/productCacheStore"
import { getUserOrders } from "@/services/orderService"
import { toast } from "sonner"

export function Navbar() {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuthStore()
  const { totalItems, toggleCart } = useCartStore()
  const { items: wishlistItems } = useWishlistStore()
  const { theme, toggleTheme } = useThemeStore()
  const { notifications, unreadCount } = useNotificationStore()
  const { markAsRead, refreshNotifications } = useNotificationSync()

  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isWalletOpen, setIsWalletOpen] = useState(false)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const walletRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)

  const fetchProducts = useProductCacheStore((s) => s.fetchProducts)

  useEffect(() => {
    fetchProducts().catch(() => {})
  }, [fetchProducts])

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (!isNotificationsOpen && !isUserDropdownOpen && !isWalletOpen) return

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node

      if (
        isNotificationsOpen &&
        notificationsRef.current &&
        !notificationsRef.current.contains(target)
      ) {
        setIsNotificationsOpen(false)
      }

      if (isWalletOpen && walletRef.current && !walletRef.current.contains(target)) {
        setIsWalletOpen(false)
      }

      if (
        isUserDropdownOpen &&
        userDropdownRef.current &&
        !userDropdownRef.current.contains(target)
      ) {
        setIsUserDropdownOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsNotificationsOpen(false)
        setIsWalletOpen(false)
        setIsUserDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("touchstart", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isNotificationsOpen, isUserDropdownOpen, isWalletOpen])

  const handleLogout = async () => {
    await signOut()
    setIsUserDropdownOpen(false)
    navigate("/")
  }

  const handleNotificationClick = async (notif: {
    id: string
    title: string
    message: string
  }) => {
    await markAsRead(notif.id)
    setIsNotificationsOpen(false)

    const title = String(notif.title || "").toLowerCase()
    const message = String(notif.message || "")

    // Customer: open the ordered product directly when possible.
    if (profile?.role !== "seller") {
      const shortOrderMatch = message.match(/#([a-f0-9]{8})/i)
      if (shortOrderMatch) {
        try {
          const orders = await getUserOrders()
          const hit = (orders || []).find((o) => o.id?.startsWith(shortOrderMatch[1]))
          const productId = hit?.order_items?.[0]?.product_id
          if (productId) {
            navigate(`/product/${productId}`)
            return
          }
        } catch {
          // Fallback to orders page when lookup fails
        }
      }
      if (title.includes("order")) {
        navigate("/orders")
      }
      return
    }

    // Seller: route operational notifications to seller orders.
    if (title.includes("order") || title.includes("review")) {
      navigate("/seller/orders")
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "py-3 glass shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
          : "py-5 bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <Logo size="md" />
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className={({ isActive }) =>
                `font-sans text-sm font-medium transition-colors hover:text-primary-400 ${
                  isActive ? "text-primary-400 font-semibold" : "text-surface-300"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          {profile?.role === "seller" && (
            <NavLink
              to="/seller/dashboard"
              className="font-sans text-sm font-medium text-surface-300 transition-colors hover:text-primary-400"
            >
              Seller Panel
            </NavLink>
          )}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <SmartSearchBar
            variant="desktop"
            className="hidden lg:block w-60"
            inputClassName="glass-light border border-surface-700/50 rounded-full py-1.5 pl-4 pr-[5.75rem] w-full h-9 text-sm font-sans focus:outline-none focus:border-primary-500 text-surface-200"
          />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full glass-light hover:bg-surface-800 transition-colors text-surface-300 hover:text-primary-400"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Wishlist Icon */}
          {profile?.role !== "seller" && (
            <Link
              to="/wishlist"
              className="p-2 rounded-full glass-light hover:bg-surface-800 transition-colors text-surface-300 hover:text-primary-400 relative"
            >
              <Heart className="w-5 h-5" />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-1 -right-1 gradient-primary text-[10px] font-bold text-white rounded-full w-4 h-4 flex items-center justify-center">
                  {wishlistItems.length}
                </span>
              )}
            </Link>
          )}

          {/* Cart Icon */}
          {profile?.role !== "seller" && (
            <button
              onClick={toggleCart}
              className="p-2 rounded-full glass-light hover:bg-surface-800 transition-colors text-surface-300 hover:text-primary-400 relative cursor-pointer"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems() > 0 && (
                <span className="absolute -top-1 -right-1 gradient-primary text-[10px] font-bold text-white rounded-full w-4 h-4 flex items-center justify-center">
                  {totalItems()}
                </span>
              )}
            </button>
          )}

          {/* Wallet Icon (customers) */}
          {user && profile?.role !== "seller" && (
            <div className="relative" ref={walletRef}>
              <button
                type="button"
                onClick={() => {
                  const opening = !isWalletOpen
                  setIsWalletOpen(opening)
                  setIsNotificationsOpen(false)
                  setIsUserDropdownOpen(false)
                }}
                className="p-2 rounded-full glass-light hover:bg-surface-800 transition-colors text-surface-300 hover:text-primary-400 relative cursor-pointer"
                aria-label="Urban-Basket Wallet"
                title="Wallet balance"
              >
                <Wallet className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {isWalletOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-3 w-[min(100vw-2rem,22rem)] glass rounded-xl overflow-hidden shadow-2xl z-50 border border-surface-700/50"
                  >
                    <div className="p-3 border-b border-surface-700/50 bg-surface-900/40">
                      <h4 className="font-display font-semibold text-sm text-surface-100">
                        My Wallet
                      </h4>
                    </div>
                    <WalletPanel compact />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Notifications Icon */}
          {user && (
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => {
                  const opening = !isNotificationsOpen
                  setIsNotificationsOpen(opening)
                  setIsUserDropdownOpen(false)
                  setIsWalletOpen(false)
                  if (opening) refreshNotifications()
                }}
                className="p-2 rounded-full glass-light hover:bg-surface-800 transition-colors text-surface-300 hover:text-primary-400 relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 gradient-primary text-[10px] font-bold text-white rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-3 w-80 glass rounded-xl overflow-hidden shadow-2xl z-50 border border-surface-700/50"
                  >
                    <div className="p-4 border-b border-surface-700/50 flex justify-between items-center bg-surface-900/40">
                      <h4 className="font-display font-semibold text-sm">Notifications</h4>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-semibold gradient-primary px-2 py-0.5 rounded-full text-white">
                          {unreadCount} New
                        </span>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-surface-800/40">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-surface-400">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-3.5 hover:bg-surface-800/20 transition-colors cursor-pointer ${
                              !notif.is_read ? "bg-primary-500/5" : ""
                            }`}
                          >
                            <h5 className="font-semibold text-xs text-surface-200">{notif.title}</h5>
                            <p className="text-[11px] text-surface-400 mt-1">{notif.message}</p>
                            <span className="text-[9px] text-surface-500 block mt-1.5">
                              {new Date(notif.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* User Profile Dropdown or Sign In */}
          {user ? (
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => {
                  setIsUserDropdownOpen(!isUserDropdownOpen)
                  setIsNotificationsOpen(false)
                  setIsWalletOpen(false)
                }}
                className="flex items-center gap-1.5 glass-light pl-2 pr-3 py-1 rounded-full border border-surface-700/40 hover:border-primary-500/50 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    profile?.name?.slice(0, 2).toUpperCase() || "U"
                  )}
                </div>
                <span className="text-xs font-sans font-medium text-surface-200 max-w-[80px] truncate hidden sm:inline">
                  {profile?.name || "User"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-surface-400" />
              </button>

              <AnimatePresence>
                {isUserDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-3 w-56 glass rounded-xl overflow-hidden shadow-2xl z-50 border border-surface-700/50"
                  >
                    <div className="p-4 border-b border-surface-700/50 bg-surface-900/40">
                      <p className="text-xs text-surface-400">Signed in as</p>
                      <p className="font-semibold text-sm text-surface-100 truncate">{profile?.name}</p>
                      <p className="text-[10px] text-surface-500 truncate">{profile?.email}</p>
                      <span className="inline-block mt-2 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded gradient-primary text-white">
                        {profile?.role}
                      </span>
                    </div>

                    <div className="p-1.5 space-y-0.5">
                      <Link
                        to="/profile"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-surface-200 hover:bg-surface-800/40 hover:text-primary-400 transition-all"
                      >
                        <User className="w-4 h-4" />
                        Profile Settings
                      </Link>

                      {profile?.role !== "seller" && (
                        <>
                          <Link
                            to="/wallet"
                            onClick={() => setIsUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-surface-200 hover:bg-surface-800/40 hover:text-primary-400 transition-all"
                          >
                            <Wallet className="w-4 h-4" />
                            Urban-Basket Wallet
                          </Link>
                          <Link
                            to="/orders"
                            onClick={() => setIsUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-surface-200 hover:bg-surface-800/40 hover:text-primary-400 transition-all"
                          >
                            <ShoppingBag className="w-4 h-4" />
                            Order History
                          </Link>
                        </>
                      )}

                      {profile?.role === "seller" ? (
                        <Link
                          to="/seller/dashboard"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-surface-200 hover:bg-surface-800/40 hover:text-primary-400 transition-all"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Seller Dashboard
                        </Link>
                      ) : null}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2 rounded-full gradient-primary text-sm font-sans font-semibold text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              Sign In
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 md:hidden rounded-full glass-light hover:bg-surface-800 transition-colors text-surface-300 hover:text-primary-400"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-surface-700/50 w-full overflow-hidden shadow-2xl"
          >
            <div className="px-4 py-6 space-y-4 max-w-lg mx-auto">
              <SmartSearchBar
                variant="mobile"
                className="relative mb-4 z-[70]"
                inputClassName="glass-light border border-surface-700/50 rounded-full py-2 pl-4 pr-[6rem] w-full h-10 text-sm font-sans focus:outline-none focus:border-primary-500 text-surface-200 animate-fade-in"
                onSearchExecuted={() => setIsMobileMenuOpen(false)}
              />

              <div className="flex flex-col gap-3.5">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `px-4 py-2.5 rounded-xl font-medium text-sm font-sans transition-colors ${
                        isActive
                          ? "gradient-primary text-white"
                          : "text-surface-300 hover:bg-surface-800/30 hover:text-primary-400"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                {profile?.role === "seller" && (
                  <NavLink
                    to="/seller/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-surface-300 font-medium text-sm font-sans transition-colors hover:bg-surface-800/30 hover:text-primary-400"
                  >
                    Seller Dashboard
                  </NavLink>
                )}
                {user && profile?.role !== "seller" && (
                  <NavLink
                    to="/wallet"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `px-4 py-2.5 rounded-xl font-medium text-sm font-sans transition-colors flex items-center gap-2 ${
                        isActive
                          ? "gradient-primary text-white"
                          : "text-surface-300 hover:bg-surface-800/30 hover:text-primary-400"
                      }`
                    }
                  >
                    <Wallet className="w-4 h-4" />
                    My Wallet
                  </NavLink>
                )}
                {!user && (
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-2.5 rounded-xl gradient-primary text-white font-semibold text-center text-sm font-sans transition-all hover:scale-[1.02]"
                  >
                    Sign In / Sign Up
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
