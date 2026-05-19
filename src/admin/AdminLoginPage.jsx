import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ADMIN_CREDENTIALS } from './adminConfig'
import './admin.css'

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
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    if (!isAdminPhone(phone) || password !== ADMIN_CREDENTIALS.password) {
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
    <section className="admin-auth-shell">
      <div className="admin-auth-card">
        <p className="admin-mini">Gaon Control Center</p>
        <h1>Admin Panel Login</h1>
        <span>Manage products, orders, and operations in one place.</span>

        <form className="admin-auth-form" onSubmit={handleSubmit}>
          <label htmlFor="admin-phone">Phone Number</label>
          <input
            id="admin-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="9699275778"
          />

          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
          />

          {error && <p className="admin-error">{error}</p>}

          <button type="submit" className="admin-add-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Opening...' : 'Open Dashboard'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default AdminLoginPage


