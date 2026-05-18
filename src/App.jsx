import { Suspense, lazy, useState } from 'react'
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom'
import { readStorage, writeStorage } from './utils/storage'
import { StoreProvider } from './context/StoreContext'
import './App.css'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const ShopPage = lazy(() => import('./pages/ShopPage'))
const CategoryProductsPage = lazy(() => import('./pages/CategoryProductsPage'))
const OrdersPage = lazy(() => import('./pages/OrdersPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const StoreLayout = lazy(() => import('./components/StoreLayout'))
const AdminLoginPage = lazy(() => import('./admin/AdminLoginPage'))
const AdminPanelLayout = lazy(() => import('./admin/AdminPanelLayout'))
const AdminOverviewPage = lazy(() => import('./admin/pages/AdminOverviewPage'))
const AdminProductsPage = lazy(() => import('./admin/pages/AdminProductsPage'))
const AdminOrdersPage = lazy(() => import('./admin/pages/AdminOrdersPage'))
const AdminInsightsPage = lazy(() => import('./admin/pages/AdminInsightsPage'))
const AdminSettingsPage = lazy(() => import('./admin/pages/AdminSettingsPage'))

const STORAGE_KEYS = {
  session: 'gaon_shop_session_v1',
  adminSession: 'gaon_shop_admin_session_v1',
}

function AppBootSkeleton() {
  return (
    <div className="app-boot-skeleton" aria-live="polite" aria-busy="true">
      <div className="app-boot-card">
        <div className="skeleton shimmer app-boot-logo" />
        <div className="skeleton shimmer app-boot-line" />
        <div className="skeleton shimmer app-boot-line short" />
        <div className="skeleton shimmer app-boot-grid" />
      </div>
    </div>
  )
}

function RequireAuth({ session }) {
  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function PublicOnly({ session }) {
  if (session) {
    return <Navigate to="/shop" replace />
  }

  return <Outlet />
}

function RequireAdmin({ adminSession }) {
  if (!adminSession) {
    return <Navigate to="/admin/login" replace />
  }

  return <Outlet />
}

function AdminPublicOnly({ adminSession }) {
  if (adminSession) {
    return <Navigate to="/admin/panel/overview" replace />
  }

  return <Outlet />
}

function AppRoutes() {
  const navigate = useNavigate()
  const [session, setSession] = useState(() =>
    readStorage(STORAGE_KEYS.session, null),
  )
  const [adminSession, setAdminSession] = useState(() =>
    readStorage(STORAGE_KEYS.adminSession, null),
  )

  const handleLogin = (nextSession) => {
    setSession(nextSession)
    writeStorage(STORAGE_KEYS.session, nextSession)
  }

  const handleLogout = () => {
    setSession(null)
    writeStorage(STORAGE_KEYS.session, null)
    navigate('/login', { replace: true })
  }

  const handleAdminLogin = (nextAdminSession) => {
    setAdminSession(nextAdminSession)
    writeStorage(STORAGE_KEYS.adminSession, nextAdminSession)
  }

  const handleAdminLogout = () => {
    setAdminSession(null)
    writeStorage(STORAGE_KEYS.adminSession, null)
    navigate('/admin/login', { replace: true })
  }

  return (
    <Routes>
      <Route element={<PublicOnly session={session} />}>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route
          path="/signup"
          element={<SignupPage onSignupSuccess={handleLogin} />}
        />
      </Route>

      <Route element={<AdminPublicOnly adminSession={adminSession} />}>
        <Route
          path="/admin/login"
          element={<AdminLoginPage onAdminLogin={handleAdminLogin} />}
        />
      </Route>

      <Route element={<RequireAdmin adminSession={adminSession} />}>
        <Route
          path="/admin/panel"
          element={
            <StoreProvider session={session} scope="admin">
              <AdminPanelLayout onAdminLogout={handleAdminLogout} />
            </StoreProvider>
          }
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<AdminOverviewPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="insights" element={<AdminInsightsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>

      <Route element={<RequireAuth session={session} />}>
        <Route
          path="/"
          element={
            <StoreProvider session={session} scope="customer">
              <StoreLayout session={session} onLogout={handleLogout} />
            </StoreProvider>
          }
        >
          <Route index element={<Navigate to="/shop" />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="products/:categoryName" element={<CategoryProductsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="account" element={<AccountPage session={session} onLogout={handleLogout} />} />
        </Route>
      </Route>

      <Route path="/admin" element={<Navigate to="/admin/login" replace />} />

      <Route
        path="*"
        element={<Navigate to={session ? '/shop' : '/login'} replace />}
      />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<AppBootSkeleton />}>
        <AppRoutes />
      </Suspense>
    </BrowserRouter>
  )
}

export default App
