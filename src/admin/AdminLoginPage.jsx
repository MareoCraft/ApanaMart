import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { ADMIN_CREDENTIALS } from './adminConfig'
import AuthCard from '../components/AuthCard'

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

  useEffect(() => {
    if (!error) return undefined
    const timer = setTimeout(() => setError(''), 3000)
    return () => clearTimeout(timer)
  }, [error])

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
    <AuthCard
      title="Admin Login"
      subtitle="Manage products, orders, and operations in one place."
      footer={
        <p className="auth-footer">
          Customer login? <NavLink to="/login">Go to Login</NavLink>
        </p>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
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

        {error && <div className="toast toast--error">{error}</div>}

        <button type="submit" className="auth-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Opening...' : 'Open Dashboard'}
        </button>
      </form>
    </AuthCard>
  )
}

export default AdminLoginPage
