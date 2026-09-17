import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Eye, EyeOff, ShoppingBag, ShieldCheck, Truck } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'

import { normalizePhone } from '../utils/authHelpers'
import { readStorage, writeStorage } from '../utils/storage'
import { authConfig } from '../authConfig'
import { firestoreDb } from '../firebaseClient'

import './LoginPage.css'

const STORAGE_KEYS = {
  users: 'gaon_shop_users_v1',
}

function LoginPage({ onLogin }) {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    phone: '+91 ',
    password: '',
  })

  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (!error) return undefined

    const timer = setTimeout(() => setError(''), 3000)

    return () => clearTimeout(timer)
  }, [error])

  const findUser = async (phone) => {
    const users = readStorage(STORAGE_KEYS.users, [])

    const localUser = users.find((entry) => entry.phone === phone)

    if (localUser) return localUser

    if (!firestoreDb) return null

    const userRef = doc(
      firestoreDb,
      authConfig.usersCollection,
      phone
    )

    const remoteUser = await getDoc(userRef)

    if (!remoteUser.exists()) return null

    const data = remoteUser.data()

    const syncedUser = {
      name: data.name || '',
      phone: data.phone || phone,
      address: data.address || '',
      password: data.password || '',
      createdAt: data.createdAt || Date.now(),
    }

    writeStorage(STORAGE_KEYS.users, [...users, syncedUser])

    return syncedUser
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (isSubmitting) return

    const phone = normalizePhone(form.phone)

    if (!phone || !form.password) {
      setError('Enter valid mobile number and password.')
      return
    }

    setIsSubmitting(true)

    try {
      const user = await findUser(phone)

      if (!user || user.password !== form.password) {
        setError('Mobile number or password is incorrect.')
        return
      }

      onLogin({
        name: user.name,
        phone: user.phone,
        address: user.address || '',
      })

      navigate('/shop')
    } catch (loginError) {
      setError(
        loginError.message || 'Login failed. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-background-shape login-background-shape--one" />
      <div className="login-background-shape login-background-shape--two" />

      <section className="login-wrapper">

        {/* LEFT BRAND SECTION */}
        <div className="login-showcase">
          <div className="brand">
            <div className="brand-logo">
              <ShoppingBag size={27} strokeWidth={2.3} />
            </div>

            <div>
              <div className="brand-name">ApanaMart</div>
              <div className="brand-tagline">
                Your Everyday Online Store
              </div>
            </div>
          </div>

          <div className="showcase-content">
            <span className="showcase-badge">
              <span className="showcase-badge-dot" />
              Simple. Local. Convenient.
            </span>

            <h1>
              Everything you need,
              <span> delivered to you.</span>
            </h1>

            <p>
              Shop everyday essentials from your favorite local
              store and get them delivered right to your doorstep.
            </p>
          </div>

          <div className="showcase-features">
            <div className="showcase-feature">
              <div className="feature-icon">
                <ShoppingBag size={19} />
              </div>

              <div>
                <strong>Everyday essentials</strong>
                <span>Everything you need in one place</span>
              </div>
            </div>

            <div className="showcase-feature">
              <div className="feature-icon">
                <Truck size={19} />
              </div>

              <div>
                <strong>Easy delivery</strong>
                <span>Convenient delivery to your doorstep</span>
              </div>
            </div>

            <div className="showcase-feature">
              <div className="feature-icon">
                <ShieldCheck size={19} />
              </div>

              <div>
                <strong>Trusted shopping</strong>
                <span>A simple and reliable shopping experience</span>
              </div>
            </div>
          </div>
        </div>

        {/* LOGIN CARD */}
        <div className="login-card">
          <div className="login-card-header">
            <div className="mobile-brand-logo">
              <ShoppingBag size={22} />
            </div>

            <h2>Welcome back</h2>

            <p>
              Sign in to continue shopping with ApanaMart
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >
            <div className="form-group">
              <label htmlFor="login-phone">
                Mobile number
              </label>

              <div className="input-wrapper">
                <span className="input-prefix">+91</span>

                <input
                  id="login-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="98765 43210"
                  value={form.phone.replace('+91 ', '')}
                  onChange={(event) => {
                    const value = event.target.value.replace(
                      /\D/g,
                      ''
                    )

                    setForm((prev) => ({
                      ...prev,
                      phone: `+91 ${value}`,
                    }))
                  }}
                />
              </div>
            </div>

            <div className="form-group">
              <div className="password-label-row">
                <label htmlFor="login-password">
                  Password
                </label>
              </div>

              <div className="input-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                />

                <button
                  type="button"
                  className="password-toggle"
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

            {error && (
              <div className="login-error">
                <span>!</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="login-spinner" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <div className="login-divider">
            <span>New to ApanaMart?</span>
          </div>

          <NavLink
            to="/signup"
            className="create-account-button"
          >
            Create your account
          </NavLink>

          <p className="admin-link">
            <NavLink to="/admin/login">
              Admin Login
            </NavLink>
          </p>

          <p className="login-terms">
            By continuing, you agree to our terms and privacy policy.
          </p>
        </div>
      </section>

      <footer className="login-footer">
        © {new Date().getFullYear()} ApanaMart. All rights reserved.
      </footer>
    </main>
  )
}

export default LoginPage