import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ADMIN_SECTIONS } from './adminConfig'
import { useStore } from '../context/StoreContext'
import RouteDataLoadingSkeleton from '../components/RouteDataLoadingSkeleton'
import './admin.css'
import logo from '../../public/ApanaMartLogo2.png'

function AdminPanelLayout({ onAdminLogout }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isProductsLoading, isOrdersLoading } = useStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const isDataLoading = isProductsLoading || isOrdersLoading

  const activeSection =
    ADMIN_SECTIONS.find((section) => location.pathname.includes(`/${section.id}`)) ||
    ADMIN_SECTIONS[0]

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!isMenuOpen) {
      document.body.style.overflow = ''
      return
    }

    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  const handleAdminLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    try {
      await Promise.resolve(onAdminLogout?.())
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <section className="admin-shell">
      <div
        className={isMenuOpen ? 'admin-menu-overlay visible' : 'admin-menu-overlay'}
        onClick={() => setIsMenuOpen(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            setIsMenuOpen(false)
          }
        }}
        aria-label="Close admin menu"
      />
      <div className="admin-frame">
        <aside className={isMenuOpen ? 'admin-menu mobile-open' : 'admin-menu'}>
          <div className="admin-menu-top">
            <div className="admin-menu-head">
              <img width={200} src={logo} alt="" />
            </div>

            <nav className="admin-menu-nav">
              {ADMIN_SECTIONS.map((section) => (
                <NavLink
                  key={section.id}
                  to={`/admin/panel/${section.id}`}
                  className={({ isActive }) =>
                    isActive ? 'admin-menu-link active' : 'admin-menu-link'
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  {section.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="admin-menu-actions">
            <button type="button" className="admin-ghost-btn" onClick={() => navigate('/shop')}>
              Open Storefront
            </button>
            <button
              type="button"
              className="admin-add-btn"
              onClick={handleAdminLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </aside>

        <main className="admin-main">
          <header className="admin-topbar">
            <div className="admin-topbar-row">
              <button
                type="button"
                className="admin-sidebar-toggle"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                aria-label="Toggle admin menu"
              >
                <i className="fa-solid fa-bars" />
              </button>
              <img width={150} src={logo} alt="" />
            </div>
          </header>

          <div key={location.pathname} className="route-content admin-route-content">
            <Outlet />
            {isDataLoading ? <RouteDataLoadingSkeleton mode="admin" /> : null}
          </div>
        </main>
      </div>
    </section>
  )
}

export default AdminPanelLayout
