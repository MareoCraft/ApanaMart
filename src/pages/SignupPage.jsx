import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import AuthCard from '../components/AuthCard'
import {
  extractPhone,
  extractToken,
  loadOtpScript,
  normalizePhone,
} from '../utils/authHelpers'
import { readStorage, writeStorage } from '../utils/storage'
import { authConfig, hasMsg91Config } from '../authConfig'
import { firestoreDb } from '../firebaseClient'

const STORAGE_KEYS = {
  users: 'gaon_shop_users_v1',
}

function SignupPage({ onSignupSuccess }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [otpStatus, setOtpStatus] = useState('')
  const [verifiedPhone, setVerifiedPhone] = useState('')
  const [isOtpLoading, setIsOtpLoading] = useState(false)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)

  useEffect(() => {
    if (!error) return undefined
    const timer = setTimeout(() => setError(''), 3000)
    return () => clearTimeout(timer)
  }, [error])

  const handleFormChange = (key, value) => {
    if (key === 'phone') {
      setVerifiedPhone('')
      setOtpStatus('')
    }

    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const validateForm = () => {
    const name = form.name.trim()
    const phone = normalizePhone(form.phone)
    const address = form.address.trim()

    if (!name || !phone || !address || !form.password || !form.confirmPassword) {
      return { ok: false, message: 'Please complete all fields.' }
    }

    if (form.password.length < 6) {
      return { ok: false, message: 'Password must be at least 6 characters.' }
    }

    if (form.password !== form.confirmPassword) {
      return { ok: false, message: 'Passwords do not match.' }
    }

    return { ok: true, phone, name, address }
  }

  const phoneExistsInDatabase = async (phone) => {
    if (!firestoreDb) return false

    const userRef = doc(firestoreDb, authConfig.usersCollection, phone)
    const existingRemoteUser = await getDoc(userRef)
    return existingRemoteUser.exists()
  }

  const startOtpVerification = async () => {
    if (isCreatingAccount) return

    const validation = validateForm()
    if (!validation.ok) {
      setError(validation.message)
      setSuccess('')
      return
    }

    if (!hasMsg91Config) {
      setError('MSG91 configuration missing.')
      return
    }

    const users = readStorage(STORAGE_KEYS.users, [])
    const exists = users.some((entry) => entry.phone === validation.phone)

    if (exists) {
      setError('Account already exists with this mobile number.')
      return
    }

    try {
      const remoteExists = await phoneExistsInDatabase(validation.phone)
      if (remoteExists) {
        setError('Account already exists with this mobile number.')
        return
      }
    } catch (dbError) {
      setError(dbError.message || 'Unable to check account in database.')
      return
    }

    setError('')
    setSuccess('')
    setOtpStatus('Opening OTP verification...')
    setIsOtpLoading(true)

    try {
      await loadOtpScript(authConfig)

      if (typeof window.initSendOTP !== 'function') {
        throw new Error('OTP widget not available')
      }

      window.initSendOTP({
        widgetId: authConfig.msg91.widgetId,
        tokenAuth: authConfig.msg91.tokenAuth,
        identifier: validation.phone,
        success: async (widgetData) => {
          try {
            const accessToken = extractToken(widgetData)
            let verifyData = null

            if (
              accessToken &&
              authConfig.msg91.enableClientSideAccessTokenVerification
            ) {
              const response = await fetch(authConfig.msg91.verifyApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  authkey: authConfig.msg91.authKey,
                  'access-token': accessToken,
                }),
              })

              const text = await response.text()
              verifyData = text ? JSON.parse(text) : {}

              if (!response.ok || verifyData.type === 'error') {
                throw new Error(verifyData.message || 'OTP verification failed')
              }
            }

            if (!accessToken && !authConfig.msg91.allowWidgetSuccessFallback) {
              throw new Error('Access token missing from OTP result')
            }

            const confirmedPhone = normalizePhone(
              extractPhone(verifyData) ||
              extractPhone(widgetData) ||
              validation.phone,
            )

            if (!confirmedPhone) {
              throw new Error('Verified phone not returned by OTP')
            }

            setVerifiedPhone(confirmedPhone)
            setOtpStatus('OTP verified successfully.')
            setError('')
          } catch (otpError) {
            setVerifiedPhone('')
            setOtpStatus('')
            setError(otpError.message || 'OTP verification failed')
          } finally {
            setIsOtpLoading(false)
          }
        },
        failure: (otpError) => {
          setVerifiedPhone('')
          setOtpStatus('')
          setError(`OTP failed: ${otpError?.message || 'try again'}`)
          setIsOtpLoading(false)
        },
      })
    } catch (otpInitError) {
      setError(otpInitError.message || 'OTP init error')
      setOtpStatus('')
      setIsOtpLoading(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isCreatingAccount) return

    const validation = validateForm()
    if (!validation.ok) {
      setError(validation.message)
      setSuccess('')
      return
    }

    if (!verifiedPhone || verifiedPhone !== validation.phone) {
      setError('Verify OTP on mobile number before creating account.')
      setSuccess('')
      return
    }

    const users = readStorage(STORAGE_KEYS.users, [])
    const exists = users.some((entry) => entry.phone === validation.phone)

    if (exists) {
      setError('Account already exists with this mobile number.')
      setSuccess('')
      return
    }

    setIsCreatingAccount(true)
    try {
      try {
        if (firestoreDb) {
          const userRef = doc(
            firestoreDb,
            authConfig.usersCollection,
            validation.phone,
          )
          const existingRemoteUser = await getDoc(userRef)

          if (existingRemoteUser.exists()) {
            setError('Account already exists with this mobile number.')
            setSuccess('')
            return
          }

          await setDoc(userRef, {
            name: validation.name,
            phone: validation.phone,
            address: validation.address,
            password: form.password,
            createdAt: Date.now(),
            createdAtServer: serverTimestamp(),
          })
        }
      } catch (dbError) {
        setError(dbError.message || 'Failed to save account in database.')
        setSuccess('')
        return
      }

      const newUser = {
        name: validation.name,
        phone: validation.phone,
        address: validation.address,
        password: form.password,
        createdAt: Date.now(),
      }

      writeStorage(STORAGE_KEYS.users, [...users, newUser])

      setError('')
      setOtpStatus('')
      setSuccess('Account created successfully. Redirecting...')

      const nextSession = {
        name: validation.name,
        phone: validation.phone,
        address: validation.address,
      }

      onSignupSuccess?.(nextSession)
      navigate('/shop')
    } finally {
      setIsCreatingAccount(false)
    }
  }

  return (
    <AuthCard
      title="Sign Up"
      subtitle="Create account with mobile number"
      footer={
        <p className="auth-footer">
          Already registered? <NavLink to="/login">Login now</NavLink>
        </p>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="signup-name">Full Name</label>
        <input
          id="signup-name"
          type="text"
          placeholder="Enter your full name"
          value={form.name}
          onChange={(event) => handleFormChange('name', event.target.value)}
        />

        <label htmlFor="signup-phone">Mobile Number</label>
        <input
          id="signup-phone"
          type="tel"
          placeholder="+919876543210"
          value={form.phone}
          onChange={(event) => handleFormChange('phone', event.target.value)}
        />

        <label htmlFor="signup-address">Address</label>
        <input
          id="signup-address"
          type="text"
          placeholder="Enter your delivery address"
          value={form.address}
          onChange={(event) => handleFormChange('address', event.target.value)}
        />

        <label htmlFor="signup-password">Password</label>
        <input
          id="signup-password"
          type="password"
          placeholder="Minimum 6 characters"
          value={form.password}
          onChange={(event) => handleFormChange('password', event.target.value)}
        />

        <label htmlFor="signup-confirm-password">Confirm Password</label>
        <input
          id="signup-confirm-password"
          type="password"
          placeholder="Re-enter password"
          value={form.confirmPassword}
          onChange={(event) =>
            handleFormChange('confirmPassword', event.target.value)
          }
        />

        {otpStatus && <p className="auth-success">{otpStatus}</p>}
        {error && <div className="toast toast--error">{error}</div>}
        {success && <p className="auth-success">{success}</p>}

        <div className="auth-signup-two-btn">
          <button
            type="button"
            className="auth-btn auth-btn-secondary"
            onClick={startOtpVerification}
            disabled={isOtpLoading || isCreatingAccount}
          >
            {isOtpLoading ? 'Verifying OTP...' : 'Verify OTP'}
          </button>

          <button type="submit" className="auth-btn" disabled={isCreatingAccount || isOtpLoading}>
            {isCreatingAccount ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>
      </form>
    </AuthCard>
  )
}

export default SignupPage
