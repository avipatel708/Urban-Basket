import { useState, useEffect } from "react"
import { Link } from "react-router"
import { motion } from "motion/react"
import { Plus, Search, Pencil, Trash2, Sparkles, Loader2 } from "lucide-react"
import { CATEGORIES } from "@/utils/constants"
import { formatCurrency } from "@/lib/utils"
import { useAuthStore } from "@/store/authStore"
import { getProducts, deleteProduct } from "@/services/productService"
import type { Product } from "@/services/productService"
import { toast } from "sonner"

export default function SellerProducts() {
  const { profile } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.id) {
      fetchProducts()
    }
  }, [profile?.id])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await getProducts({ sellerId: profile?.id })
      setProducts(res.data || [])
    } catch (err: any) {
      toast.error(err.message || "Failed to load products.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    const confirm = window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)
    if (confirm) {
      try {
        await deleteProduct(id)
        setProducts(products.filter((p) => p.id !== id))
        toast.success("Product deleted successfully!")
      } catch (err: any) {
        toast.error(err.message || "Failed to delete product.")
      }
    }
  }

  // Filter products locally
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === "all" || p.category === category
    return matchesSearch && matchesCategory
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-8 font-sans"
    >
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-surface-50">My Products</h1>
          <p className="text-xs text-surface-400 mt-0.5">Manage your catalog, stock levels, and ratings.</p>
        </div>
        <Link
          to="/seller/add-product"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-xs font-semibold text-white shadow-lg shadow-primary-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          Add Product
        </Link>
      </div>

      {/* Searching and category filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl glass border border-surface-800/35">
        {/* Search */}
        <div className="relative flex items-center col-span-1 sm:col-span-2">
          <Search className="absolute left-3.5 w-4 h-4 text-surface-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search products by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full glass-light border border-surface-800/50 rounded-xl py-2 pl-11 pr-4 text-xs focus:outline-none focus:border-primary-500 text-surface-200"
          />
        </div>

        {/* Category */}
        <div className="relative flex items-center">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full glass-light border border-surface-800/50 rounded-xl py-2 px-4 text-xs focus:outline-none focus:border-primary-500 text-surface-200 cursor-pointer"
          >
            <option value="all" className="bg-surface-950">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-surface-950">
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl glass border border-surface-800/40 overflow-hidden shadow-md">
        {loading ? (
          <div className="p-16 flex items-center justify-center">
            <Loader2 className="w-8 h-8 rounded-full text-primary-500 animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <h4 className="font-semibold text-surface-200">No products found</h4>
            <p className="text-xs text-surface-450 max-w-xs mx-auto leading-relaxed">
              We couldn't find any products matching your query. Adjust your search or filters to see more results.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-800/30 text-surface-450 uppercase text-[9px] font-bold tracking-wider bg-surface-900/10">
                  <th className="py-4 pl-4 w-16">Image</th>
                  <th className="py-4">Product Name</th>
                  <th className="py-4">Category</th>
                  <th className="py-4">Price</th>
                  <th className="py-4">Stock</th>
                  <th className="py-4">Rating</th>
                  <th className="py-4 pr-4 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/20 text-surface-200">
                {filteredProducts.map((p) => {
                  // Stock badges
                  const stockColor =
                    p.stock >= 20
                      ? "text-green-400"
                      : p.stock > 5
                      ? "text-yellow-400"
                      : "text-red-400"

                  return (
                    <tr key={p.id} className="hover:bg-surface-800/10 transition-colors">
                      <td className="py-3 pl-4">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-surface-800/40 bg-surface-900/30">
                          <img src={p.image_url || ""} alt={p.title} className="w-full h-full object-cover" />
                        </div>
                      </td>
                      <td className="py-3 font-semibold text-surface-150 max-w-xs truncate pr-4">
                        {p.title}
                      </td>
                      <td className="py-3 capitalize text-surface-400">{p.category}</td>
                      <td className="py-3 font-semibold text-primary-400">{formatCurrency(p.price)}</td>
                      <td className="py-3 font-semibold">
                        <span className={`${stockColor}`}>{p.stock} units</span>
                      </td>
                      <td className="py-3 font-medium">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-yellow-500/80 fill-yellow-500/80" />
                          {p.rating?.toFixed(1) || "5.0"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/seller/edit-product/${p.id}`}
                            className="p-1.5 rounded-lg glass-light border border-surface-800 hover:border-primary-500/50 hover:text-primary-400 transition-all"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(p.id, p.title)}
                            className="p-1.5 rounded-lg glass-light border border-surface-800 hover:border-red-500/50 hover:text-red-400 transition-all cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
