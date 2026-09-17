import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  LayoutDashboard,
  Package,
  ShieldCheck,
  ShoppingCart,
} from 'lucide-react'

import { ADMIN_CREDENTIALS } from './adminConfig'
import './AdminLoginPage.css'

function normalizeDigits(value) {
  return value.replace(/\D/g, '')
}

function isAdminPhone(value) {
  const digits = normalizeDigits(value)

  return (
    digits === ADMIN_CREDENTIALS.phone ||
    digits === `91${ADMIN_CREDENTIALS.phone}` ||
    digits.slice(-10) === ADMIN_CREDENTIALS.phone
  )
}

function AdminLoginPage({ onAdminLogin }) {
  const navigate = useNavigate()

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!error) return undefined

    const timer = setTimeout(() => setError(''), 3000)

    return () => clearTimeout(timer)
  }, [error])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (isSubmitting) return

    if (
      !isAdminPhone(phone) ||
      password !== ADMIN_CREDENTIALS.password
    ) {
      setError('Invalid admin phone or password.')
      return
    }

    setIsSubmitting(true)

    const adminSession = {
      phone: ADMIN_CREDENTIALS.phone,
      loggedAt: Date.now(),
    }

    try {
      await Promise.resolve(onAdminLogin?.(adminSession))
      navigate('/admin/panel/overview')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="admin-login-page">

      {/* Background decorations */}
      <div className="admin-bg-circle admin-bg-circle--one" />
      <div className="admin-bg-circle admin-bg-circle--two" />

      <section className="admin-login-wrapper">

        {/* =================================
            LEFT ADMIN SHOWCASE
        ================================= */}
        <div className="admin-showcase">

          <div className="admin-brand">
            <div className="admin-brand-icon">
              <LayoutDashboard size={25} />
            </div>

            <div>
              <div className="admin-brand-name">
                ApanaMart
              </div>

              <div className="admin-brand-label">
                ADMINISTRATION
              </div>
            </div>
          </div>

          <div className="admin-showcase-content">

            <div className="admin-badge">
              <span className="admin-badge-dot" />
              Secure Admin Portal
            </div>

            <h1>
              Manage your
              <span> store with ease.</span>
            </h1>

            <p>
              Access your ApanaMart management dashboard to
              manage products, orders and daily store operations.
            </p>

          </div>

          <div className="admin-features">

            <div className="admin-feature">
              <div className="admin-feature-icon">
                <Package size={18} />
              </div>

              <div>
                <strong>Products</strong>
                <span>Manage your inventory</span>
              </div>
            </div>

            <div className="admin-feature">
              <div className="admin-feature-icon">
                <ShoppingCart size={18} />
              </div>

              <div>
                <strong>Orders</strong>
                <span>Track customer orders</span>
              </div>
            </div>

            <div className="admin-feature">
              <div className="admin-feature-icon">
                <ShieldCheck size={18} />
              </div>

              <div>
                <strong>Secure</strong>
                <span>Protected admin access</span>
              </div>
            </div>

          </div>
        </div>


        {/* =================================
            LOGIN CARD
        ================================= */}
        <div className="admin-login-card">

          <div className="admin-login-header">

            <div className="admin-mobile-icon">
              <LayoutDashboard size={22} />
            </div>

            <div className="admin-login-label">
              ADMIN PORTAL
            </div>

            <h2>
              Welcome back
            </h2>

            <p>
              Sign in to access your ApanaMart dashboard.
            </p>

          </div>


          <form
            className="admin-login-form"
            onSubmit={handleSubmit}
          >

            {/* Phone */}
            <div className="admin-form-group">

              <label htmlFor="admin-phone">
                Phone number
              </label>

              <div className="admin-input-wrapper">

                <span className="admin-input-prefix">
                  +91
                </span>

                <input
                  id="admin-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => {
                    setPhone(
                      event.target.value.replace(/\D/g, '')
                    )
                  }}
                  placeholder="Enter mobile number"
                />

              </div>

            </div>


            {/* Password */}
            <div className="admin-form-group">

              <label htmlFor="admin-password">
                Password
              </label>

              <div className="admin-input-wrapper">

                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                />

                <button
                  type="button"
                  className="admin-password-toggle"
                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>

              </div>

            </div>


            {/* Error */}
            {error && (
              <div className="admin-login-error">
                <span>!</span>
                {error}
              </div>
            )}


            {/* Submit */}
            <button
              type="submit"
              className="admin-login-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="admin-spinner" />
                  Opening dashboard...
                </>
              ) : (
                <>
                  <LayoutDashboard size={17} />
                  Open Dashboard
                </>
              )}
            </button>

          </form>


          {/* Customer login */}
          <div className="admin-login-divider">
            <span>Are you a customer?</span>
          </div>

          <NavLink
            to="/login"
            className="admin-customer-button"
          >
            Go to Customer Login
          </NavLink>


          <p className="admin-security-note">
            <ShieldCheck size={13} />
            Authorized administrators only
          </p>

        </div>

      </section>


      <footer className="admin-login-footer">
        © {new Date().getFullYear()} ApanaMart · Admin Portal
      </footer>

    </main>
  )
}

export default AdminLoginPage