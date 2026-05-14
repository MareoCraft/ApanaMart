import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import AuthCard from '../components/AuthCard'
import { normalizePhone } from '../utils/authHelpers'
import { readStorage, writeStorage } from '../utils/storage'
import { authConfig } from '../authConfig'
import { firestoreDb } from '../firebaseClient'

const STORAGE_KEYS = {
  users: 'gaon_shop_users_v1',
}

function LoginPage({ onLogin }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ phone: '', password: '' })
  const [error, setError] = useState('')

  const findUser = async (phone) => {
    const users = readStorage(STORAGE_KEYS.users, [])
    const localUser = users.find((entry) => entry.phone === phone)
    if (localUser) return localUser

    if (!firestoreDb) return null

    const userRef = doc(firestoreDb, authConfig.usersCollection, phone)
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
    const phone = normalizePhone(form.phone)

    if (!phone || !form.password) {
      setError('Enter valid mobile number and password.')
      return
    }

    try {
      const user = await findUser(phone)

      if (!user || user.password !== form.password) {
        setError('Mobile number or password is incorrect.')
        return
      }

      onLogin({ name: user.name, phone: user.phone, address: user.address || '' })
      navigate('/shop')
    } catch (loginError) {
      setError(loginError.message || 'Login failed. Please try again.')
    }
  }

  return (
    <AuthCard
      title="Login"
      subtitle="Access your one-shop delivery dashboard"
      footer={
        <p className="auth-footer">
          New customer? <NavLink to="/signup">Create account</NavLink> |{' '}
          <NavLink to="/admin/login">Admin</NavLink>
        </p>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="login-phone">Mobile Number</label>
        <input
          id="login-phone"
          type="tel"
          placeholder="+919876543210"
          value={form.phone || "+91"}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, phone: event.target.value }))
          }
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          placeholder="Enter password"
          value={form.password}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, password: event.target.value }))
          }
        />

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" className="auth-btn">
          Login
        </button>
      </form>
    </AuthCard>
  )
}

export default LoginPage

