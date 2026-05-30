import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Tag,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Percent,
  DollarSign,
  TrendingUp,
  Gift,
  Clock,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import {
  getSellerCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponStats
} from "@/services/couponService"
import type { Coupon, CouponStats } from "@/services/couponService"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

export default function CouponManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [stats, setStats] = useState<CouponStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    coupon_code: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: "",
    minimum_order_amount: "",
    maximum_discount: "",
    expiry_date: "",
    usage_limit: "",
    first_order_only: false,
    user_specific_expiry: "",
    random_discount_enabled: false,
    random_discount_min: "",
    random_discount_max: ""
  })

  // Delete modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [couponsData, statsData] = await Promise.all([
        getSellerCoupons(),
        getCouponStats()
      ])
      setCoupons(couponsData)
      setStats(statsData)
    } catch (err: any) {
      toast.error(err.message || "Failed to load coupon data.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleToggleChange = (name: "first_order_only" | "random_discount_enabled") => {
    setFormData((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.coupon_code.trim()) {
      toast.error("Coupon code is required.")
      return
    }
    if (!formData.discount_value) {
      toast.error("Discount value is required.")
      return
    }

    setIsSubmitting(true)
    try {
      const parsedData: Partial<Coupon> = {
        coupon_code: formData.coupon_code.trim().toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        minimum_order_amount: formData.minimum_order_amount ? parseFloat(formData.minimum_order_amount) : 0,
        maximum_discount: formData.maximum_discount ? parseFloat(formData.maximum_discount) : null,
        expiry_date: formData.expiry_date ? formData.expiry_date : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : 0,
        first_order_only: formData.first_order_only,
        user_specific_expiry: formData.user_specific_expiry ? parseInt(formData.user_specific_expiry) : 0,
        random_discount_enabled: formData.random_discount_enabled,
        random_discount_min: formData.random_discount_min ? parseFloat(formData.random_discount_min) : 0,
        random_discount_max: formData.random_discount_max ? parseFloat(formData.random_discount_max) : 0
      }

      await createCoupon(parsedData)
      toast.success("Coupon code created successfully!")
      setIsFormOpen(false)
      setFormData({
        coupon_code: "",
        discount_type: "percentage",
        discount_value: "",
        minimum_order_amount: "",
        maximum_discount: "",
        expiry_date: "",
        usage_limit: "",
        first_order_only: false,
        user_specific_expiry: "",
        random_discount_enabled: false,
        random_discount_min: "",
        random_discount_max: ""
      })
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Failed to create coupon.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateCoupon(id, { is_active: !currentStatus })
      toast.success(`Coupon ${!currentStatus ? "activated" : "deactivated"} successfully!`)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Failed to update coupon status.")
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirmId) return
    try {
      await deleteCoupon(deleteConfirmId)
      toast.success("Coupon deleted successfully.")
      setDeleteConfirmId(null)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete coupon.")
    }
  }

  const isExpired = (expiry: string | null) => {
    if (!expiry) return false
    return new Date(expiry) < new Date()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12 font-sans text-surface-200"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-surface-50">Coupons & Promos</h1>
          <p className="text-xs text-surface-450 mt-0.5">Manage customer discount codes, campaigns, and vouchers.</p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="gradient-primary text-white rounded-full px-5 py-2.5 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all duration-200 hover:scale-103 active:scale-97 shadow-lg shadow-primary-500/20"
        >
          {isFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isFormOpen ? "Cancel" : "Create Coupon"}
        </button>
      </div>

      {/* Stats Cards Row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl glass border border-surface-800/40 p-4.5 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-primary-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-surface-450 uppercase tracking-wide">Active Coupons</p>
              <h3 className="font-display font-bold text-xl text-surface-100 mt-1">{stats.totalActive}</h3>
            </div>
          </div>

          <div className="rounded-2xl glass border border-surface-800/40 p-4.5 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-accent-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="w-10 h-10 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center text-accent-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-surface-450 uppercase tracking-wide">Total Redemptions</p>
              <h3 className="font-display font-bold text-xl text-surface-100 mt-1">{stats.totalUsage}</h3>
            </div>
          </div>

          <div className="rounded-2xl glass border border-surface-800/40 p-4.5 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-green-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-surface-450 uppercase tracking-wide">Discounts Given</p>
              <h3 className="font-display font-bold text-xl text-surface-100 mt-1">{formatCurrency(stats.totalDiscountGiven)}</h3>
            </div>
          </div>

          <div className="rounded-2xl glass border border-surface-800/40 p-4.5 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-surface-450 uppercase tracking-wide">Expired Codes</p>
              <h3 className="font-display font-bold text-xl text-surface-100 mt-1">{stats.expiredCount}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Expandable Form */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl glass border border-surface-800/40 p-6 sm:p-8 space-y-6 shadow-xl relative"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-[80px] pointer-events-none" />
              
              <div className="flex items-center gap-2 border-b border-surface-800/30 pb-4">
                <Gift className="w-5 h-5 text-primary-400" />
                <h3 className="font-display font-semibold text-base text-surface-150">Create New Discount Coupon</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* Coupon Code */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-surface-450 uppercase font-sans tracking-wide">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    name="coupon_code"
                    placeholder="E.G. AUTUMN25"
                    value={formData.coupon_code}
                    onChange={handleInputChange}
                    className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-xs font-sans focus:outline-none focus:border-primary-500 text-surface-200 uppercase"
                    required
                  />
                </div>

                {/* Discount Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-surface-450 uppercase font-sans tracking-wide">
                    Discount Type *
                  </label>
                  <select
                    name="discount_type"
                    value={formData.discount_type}
                    onChange={handleInputChange}
                    className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-xs font-sans focus:outline-none focus:border-primary-500 text-surface-200 cursor-pointer"
                  >
                    <option value="percentage" className="bg-surface-950">Percentage (%)</option>
                    <option value="fixed" className="bg-surface-950">Fixed Amount (₹)</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-surface-450 uppercase font-sans tracking-wide">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    name="discount_value"
                    placeholder={formData.discount_type === "percentage" ? "E.G. 20" : "E.G. 250"}
                    value={formData.discount_value}
                    onChange={handleInputChange}
                    className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-xs font-sans focus:outline-none focus:border-primary-500 text-surface-200"
                    required
                    min="1"
                  />
                </div>

                {/* Minimum Order */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-surface-450 uppercase font-sans tracking-wide">
                    Minimum Order Amount (₹)
                  </label>
                  <input
                    type="number"
                    name="minimum_order_amount"
                    placeholder="E.G. 999"
                    value={formData.minimum_order_amount}
                    onChange={handleInputChange}
                    className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-xs font-sans focus:outline-none focus:border-primary-500 text-surface-200"
                    min="0"
                  />
                </div>

                {/* Maximum Discount */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-surface-450 uppercase font-sans tracking-wide">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    name="maximum_discount"
                    placeholder="E.G. 500 (Optional)"
                    value={formData.maximum_discount}
                    onChange={handleInputChange}
                    className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-xs font-sans focus:outline-none focus:border-primary-500 text-surface-200"
                    min="0"
                  />
                </div>

                {/* Expiry Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-surface-450 uppercase font-sans tracking-wide">
                    Expiry Date
                  </label>
                  <input
                    type="datetime-local"
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={handleInputChange}
                    className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-xs font-sans focus:outline-none focus:border-primary-500 text-surface-200 cursor-pointer"
                  />
                </div>

                {/* Usage Limit */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-surface-450 uppercase font-sans tracking-wide">
                    Overall Usage Limit
                  </label>
                  <input
                    type="number"
                    name="usage_limit"
                    placeholder="E.G. 100 (0 for unlimited)"
                    value={formData.usage_limit}
                    onChange={handleInputChange}
                    className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-xs font-sans focus:outline-none focus:border-primary-500 text-surface-200"
                    min="0"
                  />
                </div>

                {/* User Specific Registration Expiry */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-surface-450 uppercase font-sans tracking-wide">
                    Valid days after registration
                  </label>
                  <input
                    type="number"
                    name="user_specific_expiry"
                    placeholder="E.G. 30 days (0 for disabled)"
                    value={formData.user_specific_expiry}
                    onChange={handleInputChange}
                    className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-xs font-sans focus:outline-none focus:border-primary-500 text-surface-200"
                    min="0"
                  />
                </div>

                {/* First Order Only Toggle */}
                <div className="space-y-1.5 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-surface-450 uppercase font-sans tracking-wide block mb-2">
                    First Order Only
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleChange("first_order_only")}
                    className="flex items-center gap-2 text-surface-300 text-xs font-semibold cursor-pointer text-left w-fit self-start"
                  >
                    {formData.first_order_only ? (
                      <ToggleRight className="w-8 h-8 text-primary-400" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-surface-500" />
                    )}
                    <span>{formData.first_order_only ? "Enabled" : "Disabled"}</span>
                  </button>
                </div>
              </div>

              {/* Random Discount Settings */}
              <div className="border-t border-surface-800/30 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent-400 animate-pulse" />
                    <span className="text-xs font-bold text-surface-150 uppercase font-sans tracking-wide">
                      Enable Random Gamified Discount Range
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleChange("random_discount_enabled")}
                    className="cursor-pointer"
                  >
                    {formData.random_discount_enabled ? (
                      <ToggleRight className="w-8 h-8 text-accent-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-surface-500" />
                    )}
                  </button>
                </div>

                {formData.random_discount_enabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-surface-450 uppercase font-sans tracking-wide">
                        Min Random Percentage (%)
                      </label>
                      <input
                        type="number"
                        name="random_discount_min"
                        placeholder="E.G. 10"
                        value={formData.random_discount_min}
                        onChange={handleInputChange}
                        className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-xs font-sans focus:outline-none focus:border-primary-500 text-surface-200"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-surface-450 uppercase font-sans tracking-wide">
                        Max Random Percentage (%)
                      </label>
                      <input
                        type="number"
                        name="random_discount_max"
                        placeholder="E.G. 25"
                        value={formData.random_discount_max}
                        onChange={handleInputChange}
                        className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-xs font-sans focus:outline-none focus:border-primary-500 text-surface-200"
                        min="0"
                        max="100"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-surface-800/30">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-full px-5 py-2 text-xs font-semibold text-surface-400 hover:text-surface-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="gradient-primary text-white rounded-full px-6 py-2.5 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-primary-500/25 transition-all hover:scale-103 active:scale-97 disabled:opacity-50 disabled:scale-100"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Campaign"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main List Section */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-2xl glass border border-surface-800/40 p-6 h-36 animate-pulse flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="h-6 w-32 bg-surface-800/60 rounded-lg" />
                <div className="h-5 w-16 bg-surface-800/60 rounded-full" />
              </div>
              <div className="h-4 w-48 bg-surface-800/60 rounded-lg" />
              <div className="h-4 w-full bg-surface-800/40 rounded-lg" />
            </div>
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="rounded-3xl glass p-12 text-center space-y-4 border border-surface-800/40">
          <div className="w-16 h-16 rounded-full glass flex items-center justify-center mx-auto text-surface-500">
            <Gift className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-200">No promo campaigns yet</h3>
            <p className="text-xs text-surface-450 mt-1 max-w-xs mx-auto leading-relaxed">
              Create your first promotional code to start giving your users discount rewards and boost sales!
            </p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex py-2.5 px-6 gradient-primary text-white rounded-full font-sans text-xs font-semibold cursor-pointer shadow-lg shadow-primary-500/20"
          >
            Launch First Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {coupons.map((coupon) => {
            const isExpiredState = isExpired(coupon.expiry_date)
            return (
              <motion.div
                key={coupon.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl glass border p-5 flex flex-col justify-between gap-5 relative overflow-hidden transition-all duration-300 ${
                  !coupon.is_active
                    ? "border-surface-800/20 opacity-60"
                    : isExpiredState
                    ? "border-red-500/20"
                    : "border-surface-800/40 hover:border-surface-700/60 shadow-lg hover:shadow-2xl hover:shadow-primary-500/5"
                }`}
              >
                {/* Accent glow */}
                {coupon.is_active && !isExpiredState && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />
                )}

                {/* Top Section */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-extrabold text-surface-50 bg-surface-900/60 border border-surface-800/50 rounded-lg px-2.5 py-1 tracking-wider">
                        {coupon.coupon_code}
                      </span>
                      {coupon.first_order_only && (
                        <span className="text-[8px] font-bold uppercase tracking-wider gradient-primary text-white px-2 py-0.5 rounded-full">
                          First Order
                        </span>
                      )}
                      {coupon.random_discount_enabled && (
                        <span className="text-[8px] font-bold uppercase tracking-wider bg-accent-500/20 text-accent-400 border border-accent-500/30 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Sparkles className="w-2 h-2" /> Mystery
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-primary-400 mt-3 font-sans">
                      {coupon.discount_type === "percentage"
                        ? `${coupon.discount_value}% Off`
                        : `${formatCurrency(coupon.discount_value)} Off`}
                      {coupon.maximum_discount ? ` (Max ₹${coupon.maximum_discount})` : ""}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5">
                    {/* Toggle Active status */}
                    <button
                      onClick={() => handleToggleActive(coupon.id, coupon.is_active)}
                      className="cursor-pointer text-surface-450 hover:text-surface-200 transition-colors"
                      title={coupon.is_active ? "Deactivate" : "Activate"}
                    >
                      {coupon.is_active ? (
                        <ToggleRight className="w-7 h-7 text-primary-400" />
                      ) : (
                        <ToggleLeft className="w-7 h-7" />
                      )}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteConfirmId(coupon.id)}
                      className="p-1.5 rounded-lg glass-light border border-surface-800/40 text-surface-450 hover:text-red-400 hover:border-red-500/20 transition-all cursor-pointer"
                      title="Delete Coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Middle details */}
                <div className="grid grid-cols-2 gap-3.5 bg-surface-950/20 rounded-xl p-3 border border-surface-900/30 text-[10px] font-sans text-surface-400">
                  <div>
                    <span className="block text-[8px] font-bold text-surface-450 uppercase">Min Purchase</span>
                    <span className="font-semibold text-surface-250 mt-0.5 block">
                      {coupon.minimum_order_amount > 0 ? formatCurrency(coupon.minimum_order_amount) : "No Minimum"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold text-surface-450 uppercase">Redemptions</span>
                    <span className="font-semibold text-surface-250 mt-0.5 block">
                      {coupon.used_count} / {coupon.usage_limit > 0 ? coupon.usage_limit : "∞"}
                    </span>
                  </div>
                  {coupon.expiry_date && (
                    <div className="col-span-2 flex items-center gap-1.5 text-surface-450 mt-0.5 border-t border-surface-900/30 pt-1.5">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span className={isExpiredState ? "text-red-400 font-semibold" : ""}>
                        {isExpiredState
                          ? `Expired on ${new Date(coupon.expiry_date).toLocaleDateString()}`
                          : `Expires ${new Date(coupon.expiry_date).toLocaleDateString()}`}
                      </span>
                    </div>
                  )}
                  {coupon.user_specific_expiry > 0 && (
                    <div className="col-span-2 flex items-center gap-1.5 text-surface-450 pt-1 border-t border-surface-900/30">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span>Valid {coupon.user_specific_expiry} days from user signup</span>
                    </div>
                  )}
                  {coupon.random_discount_enabled && (
                    <div className="col-span-2 flex items-center gap-1.5 text-accent-400 pt-1 border-t border-surface-900/30">
                      <Sparkles className="w-3 h-3 flex-shrink-0 animate-pulse" />
                      <span>Random discount between {coupon.random_discount_min}% and {coupon.random_discount_max}%</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] max-w-[90%] glass-strong border border-surface-800/40 rounded-3xl p-6 shadow-2xl z-50 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-display font-bold text-base text-surface-100">Delete Promo Coupon?</h3>
                <p className="text-xs text-surface-450 mt-1.5 font-sans leading-relaxed">
                  Are you sure you want to permanently delete this coupon code? This action is irreversible and will remove all usage logs.
                </p>
              </div>

              <div className="flex gap-3 pt-2 font-sans">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 rounded-full py-2.5 text-xs font-semibold glass-light border border-surface-800/40 text-surface-350 hover:text-surface-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 rounded-full py-2.5 text-xs font-semibold bg-red-500 hover:bg-red-600 text-white cursor-pointer transition-colors shadow-lg shadow-red-500/10"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
