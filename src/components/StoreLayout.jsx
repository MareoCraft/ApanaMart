import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import img from "/ApanaMartLogo2.png"
import home from "/home.png"
import card from "/shopping-basket.png"
import order from "/shopping-cart.png"
import profile from "/profile.png"

function StoreLayout({ session, onLogout }) {
  const { cartStats, notice } = useStore()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="app-shell">
      <br />
      <header style={{ marginBottom: 10 }} className="app-header">
        <div className='app-logo'>
          <img width={150} src={img} alt="" />
          <div>
            {/* <h2 className="store-name">{SHOP_INFO.name}</h2> */}
            {/* <p>{SHOP_INFO.tagline}</p> */}
            {/* <p className="delivery-line">
              Delivery in {SHOP_INFO.etaMinutes}-{SHOP_INFO.etaMinutes + 8} mins
            </p> */}
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="header-chip"
            onClick={() => navigate('/account')}
          >
            <img style={{ width: 15 }} src={profile} alt="" /> &nbsp;{session.name?.split(' ')[0] || 'Account'}
          </button>
          {/* <button type="button" className="header-chip" onClick={onLogout}>
            Logout
          </button> */}
        </div>
      </header>

      <main className="content-area">
        <div key={location.pathname} className="route-content">
          <Outlet />
        </div>
      </main>

      {/* This is temprary not visible */}
      {/* {cartStats.itemCount > 0 && (
        <button type="button" className="cart-fab" onClick={() => navigate('/cart')}>
          <span>{cartStats.itemCount} items</span>
          <strong>{formatPrice(cartStats.total)}</strong>
          <em>View Cart</em>
        </button>
      )} */}

      <nav className="bottom-nav">
        <NavLink
          to="/shop"
          className={({ isActive }) =>
            isActive
              ? "bottom-nav-link active"
              : "bottom-nav-link"
          }
        >
          <img src={home} alt="Home" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/orders"
          className={({ isActive }) =>
            isActive
              ? "bottom-nav-link active"
              : "bottom-nav-link"
          }
        >
          <img src={card} alt="Orders" />
          <span>Orders</span>
        </NavLink>

        <NavLink
          to="/cart"
          className={({ isActive }) =>
            isActive
              ? "bottom-nav-link active"
              : "bottom-nav-link"
          }
        >
          <div className="nav-cart-icon">
            <img src={order} alt="Cart" />

            {cartStats.itemCount > 0 && (
              <p className="cart-badge">
                {cartStats.itemCount > 9
                  ? "9+"
                  : cartStats.itemCount}
              </p>
            )}
          </div>

          <span>Cart</span>
        </NavLink>

        <NavLink
          to="/account"
          className={({ isActive }) =>
            isActive
              ? "bottom-nav-link active"
              : "bottom-nav-link"
          }
        >
          <img src={profile} alt="Account" />
          <span>Profile</span>
        </NavLink>
      </nav>

      {notice && <div className="toast">{notice}</div>}
    </div>
  )
}

export default StoreLayout
