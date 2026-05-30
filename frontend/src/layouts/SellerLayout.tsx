import { useState, useEffect, useRef } from "react"
import { Link, NavLink, Outlet, useNavigate } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  Settings,
  Menu,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Bell,
  LogOut,
  User,
  Search,
  Sparkles,
  Tag
} from "lucide-react"
import { Logo } from "@/components/common/Logo"
import { useAuthStore } from "@/store/authStore"
import { useThemeStore } from "@/store/themeStore"
import { useNotificationStore } from "@/store/notificationStore"
import { useNotificationSync } from "@/hooks/useNotificationSync"
import { RealtimeSellerOrdersSync } from "@/components/orders/RealtimeSellerOrdersSync"
import { Toaster } from "sonner"

const sidebarLinks = [
  { href: "/seller/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/seller/products", label: "My Products", icon: Package },
  { href: "/seller/orders", label: "Orders", icon: ShoppingCart },
  { href: "/seller/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/seller/ai-assistant", label: "AI Assistant", icon: Sparkles },
  { href: "/seller/coupons", label: "Promo Coupons", icon: Tag },
  { href: "/seller/customers", label: "Customers", icon: Users },
  { href: "/seller/settings", label: "Settings", icon: Settings },
]

export default function SellerLayout() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const { notifications, unreadCount } = useNotificationStore()
  const { markAsRead, refreshNotifications } = useNotificationSync()

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  const notificationsRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isNotificationsOpen && !isUserDropdownOpen) return

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node

      if (
        isNotificationsOpen &&
        notificationsRef.current &&
        !notificationsRef.current.contains(target)
      ) {
        setIsNotificationsOpen(false)
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
  }, [isNotificationsOpen, isUserDropdownOpen])

  const handleLogout = async () => {
    await signOut()
    navigate("/")
  }

  const handleNotificationClick = async (notif: { id: string; title: string }) => {
    await markAsRead(notif.id)
    setIsNotificationsOpen(false)
    const title = String(notif.title || "").toLowerCase()
    if (title.includes("order") || title.includes("review")) {
      navigate("/seller/orders")
    }
  }

  return (
    <div className="gradient-bg min-h-screen flex text-surface-200">
      {/* 1. DESKTOP COLLAPSIBLE SIDEBAR */}
      <aside
        className={`hidden md:flex flex-col glass-strong border-r border-surface-800/40 relative z-40 transition-all duration-300 h-screen sticky top-0 ${
          isCollapsed ? "w-[76px]" : "w-[260px]"
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="p-5 border-b border-surface-800/30 flex items-center justify-between h-[75px] overflow-hidden">
          <Link to="/" className="flex-shrink-0">
            <Logo iconOnly={isCollapsed} size={isCollapsed ? "sm" : "md"} />
          </Link>
        </div>

        {/* Links Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-2.5 rounded-xl font-sans text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "gradient-primary text-white shadow-lg shadow-primary-500/20"
                      : "text-surface-450 hover:bg-surface-800/30 hover:text-primary-400"
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{link.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapsible toggle bottom button */}
        <div className="p-3 border-t border-surface-800/30">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-xl glass-light border border-surface-700/30 text-surface-400 hover:text-primary-400 hover:border-primary-500/35 transition-colors cursor-pointer"
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* 2. MAIN LAYOUT AND HEADER SECTION */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header bar */}
        <header className="h-[75px] glass border-b border-surface-800/40 px-6 flex items-center justify-between sticky top-0 z-30">
          {/* Menu Hamburger / Search input */}
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 md:hidden rounded-full glass-light hover:bg-surface-800 text-surface-400 transition-colors cursor-pointer"
              aria-label="Open Mobile Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick search */}
            <div className="relative flex items-center max-w-xs w-full hidden sm:flex">
              <Search className="absolute left-3.5 w-4 h-4 text-surface-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search dashboard..."
                className="w-full glass-light border border-surface-800/50 rounded-xl py-1.5 pl-11 pr-4 text-xs font-sans focus:outline-none focus:border-primary-500 text-surface-200"
              />
            </div>
          </div>

          {/* Action drawers / dropdowns */}
          <div className="flex items-center gap-4">
            {/* Theme selector */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full glass-light hover:bg-surface-800/60 text-surface-450 hover:text-primary-400 transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Notifications Drawer */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => {
                  const opening = !isNotificationsOpen
                  setIsNotificationsOpen(opening)
                  setIsUserDropdownOpen(false)
                  if (opening) refreshNotifications()
                }}
                className="p-2 rounded-full glass-light hover:bg-surface-800/60 text-surface-450 hover:text-primary-400 relative cursor-pointer"
              >
                <Bell className="w-4.5 h-4.5" />
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
                      <h4 className="font-display font-semibold text-xs text-surface-200">System Notifications</h4>
                      {unreadCount > 0 && (
                        <span className="text-[9px] font-bold tracking-wider gradient-primary px-2.5 py-0.5 rounded-full text-white uppercase">
                          {unreadCount} New
                        </span>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-surface-800/40">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-surface-450">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-3.5 hover:bg-surface-800/10 transition-colors cursor-pointer ${
                              !notif.is_read ? "bg-primary-500/5" : ""
                            }`}
                          >
                            <h5 className="font-bold text-xs text-surface-250">{notif.title}</h5>
                            <p className="text-[10px] text-surface-450 mt-1 leading-snug">{notif.message}</p>
                            <span className="text-[9px] text-surface-500 block mt-1.5">
                              {new Date(notif.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Menu Dropdown */}
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => {
                  setIsUserDropdownOpen(!isUserDropdownOpen)
                  setIsNotificationsOpen(false)
                }}
                className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white overflow-hidden border border-surface-700/50">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    profile?.name?.slice(0, 2).toUpperCase() || "SE"
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isUserDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-3 w-52 glass rounded-xl overflow-hidden shadow-2xl z-50 border border-surface-700/50"
                  >
                    <div className="p-4 border-b border-surface-700/50 bg-surface-900/40">
                      <p className="font-semibold text-xs text-surface-150 truncate leading-snug">{profile?.name}</p>
                      <p className="text-[9px] text-surface-500 truncate mt-0.5">{profile?.email}</p>
                      <span className="inline-block mt-2 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded gradient-primary text-white">
                        Seller Admin
                      </span>
                    </div>

                    <div className="p-1 space-y-0.5">
                      <Link
                        to="/seller/settings"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-surface-300 hover:bg-surface-800/40 hover:text-primary-400 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Account Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <RealtimeSellerOrdersSync />
          <Outlet />
        </main>
      </div>

      {/* 3. MOBILE SIDEDRAWER NAVIGATION */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden cursor-pointer"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-64 glass-strong border-r border-surface-800/40 z-50 md:hidden flex flex-col shadow-2xl"
            >
              <div className="p-5 border-b border-surface-800/30 flex items-center justify-between h-[75px]">
                <Logo size="md" />
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1 rounded-full hover:bg-surface-800 text-surface-450 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
                {sidebarLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <NavLink
                      key={link.href}
                      to={link.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3.5 px-4 py-2.5 rounded-xl font-sans text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                          isActive
                            ? "gradient-primary text-white shadow-lg shadow-primary-500/20"
                            : "text-surface-450 hover:bg-surface-800/30 hover:text-primary-400"
                        }`
                      }
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span>{link.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgba(20, 20, 25, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            color: "#F3F4F6",
            backdropFilter: "blur(12px)"
          },
          className: "glass"
        }}
      />
    </div>
  )
}
