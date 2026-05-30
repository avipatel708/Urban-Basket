import { BrowserRouter, Routes, Route } from "react-router"
import CustomerLayout from "@/layouts/CustomerLayout"
import SellerLayout from "@/layouts/SellerLayout"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"

// Customer Pages
import Landing from "@/pages/Landing"
import Login from "@/pages/Login"
import Signup from "@/pages/Signup"
import Products from "@/pages/customer/Products"
import VisualSearchPage from "@/pages/customer/VisualSearchPage"
import ProductDetail from "@/pages/customer/ProductDetail"
import Checkout from "@/pages/customer/Checkout"
import Orders from "@/pages/customer/Orders"
import OrderTrackingPage from "@/pages/customer/OrderTrackingPage"
import MysteryBoxesPage from "@/pages/customer/MysteryBoxesPage"
import MysteryBoxHistoryPage from "@/pages/customer/MysteryBoxHistoryPage"
import MysteryBoxRevealPage from "@/pages/customer/MysteryBoxRevealPage"
import WalletPage from "@/pages/customer/Wallet"
import Wishlist from "@/pages/customer/Wishlist"
import Profile from "@/pages/customer/Profile"
import NotFound from "@/pages/NotFound"
import Categories from "@/pages/Categories"
import Deals from "@/pages/Deals"

// Seller Pages
import SellerDashboard from "@/pages/seller/Dashboard"
import SellerProducts from "@/pages/seller/Products"
import AddProduct from "@/pages/seller/AddProduct"
import EditProduct from "@/pages/seller/EditProduct"
import SellerOrders from "@/pages/seller/Orders"
import Analytics from "@/pages/seller/Analytics"
import SellerSettings from "@/pages/seller/Settings"
import Customers from "@/pages/seller/Customers"
import AIAssistant from "@/pages/seller/AIAssistant"
import CouponManagement from "@/pages/seller/CouponManagement"

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Customer routes */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/visual-search" element={<VisualSearchPage />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/mystery" element={<MysteryBoxesPage />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          
          {/* Protected Customer Routes */}
          <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/track/:orderId" element={<OrderTrackingPage />} />
            <Route path="/mystery/history" element={<MysteryBoxHistoryPage />} />
            <Route path="/mystery/reveal/:rewardId" element={<MysteryBoxRevealPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/wishlist" element={<Wishlist />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["customer", "seller"]} />}>
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Seller routes */}
        <Route element={<ProtectedRoute allowedRoles={["seller"]} />}>
          <Route element={<SellerLayout />}>
            <Route path="/seller/dashboard" element={<SellerDashboard />} />
            <Route path="/seller/products" element={<SellerProducts />} />
            <Route path="/seller/add-product" element={<AddProduct />} />
            <Route path="/seller/edit-product/:id" element={<EditProduct />} />
            <Route path="/seller/orders" element={<SellerOrders />} />
            <Route path="/seller/analytics" element={<Analytics />} />
            <Route path="/seller/ai-assistant" element={<AIAssistant />} />
            <Route path="/seller/settings" element={<SellerSettings />} />
            <Route path="/seller/customers" element={<Customers />} />
            <Route path="/seller/coupons" element={<CouponManagement />} />
          </Route>
        </Route>

        {/* 404 handler */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
export default AppRouter
