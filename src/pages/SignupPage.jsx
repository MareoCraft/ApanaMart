import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  Eye,
  EyeOff,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingBag,
  UserPlus,
  Truck,
} from 'lucide-react'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'

import {
  extractPhone,
  extractToken,
  loadOtpScript,
  normalizePhone,
} from '../utils/authHelpers'

import { readStorage, writeStorage } from '../utils/storage'
import { authConfig, hasMsg91Config } from '../authConfig'
import { firestoreDb } from '../firebaseClient'

import './SignupPage.css'

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

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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

    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const validateForm = () => {
    const name = form.name.trim()
    const phone = normalizePhone(form.phone)
    const address = form.address.trim()

    if (
      !name ||
      !phone ||
      !address ||
      !form.password ||
      !form.confirmPassword
    ) {
      return {
        ok: false,
        message: 'Please complete all fields.',
      }
    }

    if (form.password.length < 6) {
      return {
        ok: false,
        message: 'Password must be at least 6 characters.',
      }
    }

    if (form.password !== form.confirmPassword) {
      return {
        ok: false,
        message: 'Passwords do not match.',
      }
    }

    return {
      ok: true,
      phone,
      name,
      address,
    }
  }

  const phoneExistsInDatabase = async (phone) => {
    if (!firestoreDb) return false

    const userRef = doc(
      firestoreDb,
      authConfig.usersCollection,
      phone
    )

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

    const exists = users.some(
      (entry) => entry.phone === validation.phone
    )

    if (exists) {
      setError(
        'Account already exists with this mobile number.'
      )
      return
    }

    try {
      const remoteExists = await phoneExistsInDatabase(
        validation.phone
      )

      if (remoteExists) {
        setError(
          'Account already exists with this mobile number.'
        )
        return
      }
    } catch (dbError) {
      setError(
        dbError.message ||
          'Unable to check account in database.'
      )
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
              authConfig.msg91
                .enableClientSideAccessTokenVerification
            ) {
              const response = await fetch(
                authConfig.msg91.verifyApiUrl,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    authkey: authConfig.msg91.authKey,
                    'access-token': accessToken,
                  }),
                }
              )

              const text = await response.text()

              verifyData = text
                ? JSON.parse(text)
                : {}

              if (
                !response.ok ||
                verifyData.type === 'error'
              ) {
                throw new Error(
                  verifyData.message ||
                    'OTP verification failed'
                )
              }
            }

            if (
              !accessToken &&
              !authConfig.msg91
                .allowWidgetSuccessFallback
            ) {
              throw new Error(
                'Access token missing from OTP result'
              )
            }

            const confirmedPhone = normalizePhone(
              extractPhone(verifyData) ||
                extractPhone(widgetData) ||
                validation.phone
            )

            if (!confirmedPhone) {
              throw new Error(
                'Verified phone not returned by OTP'
              )
            }

            setVerifiedPhone(confirmedPhone)

            setOtpStatus(
              'Mobile number verified successfully.'
            )

            setError('')
          } catch (otpError) {
            setVerifiedPhone('')
            setOtpStatus('')

            setError(
              otpError.message ||
                'OTP verification failed'
            )
          } finally {
            setIsOtpLoading(false)
          }
        },

        failure: (otpError) => {
          setVerifiedPhone('')
          setOtpStatus('')

          setError(
            `OTP failed: ${
              otpError?.message || 'try again'
            }`
          )

          setIsOtpLoading(false)
        },
      })
    } catch (otpInitError) {
      setError(
        otpInitError.message || 'OTP init error'
      )

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

    if (
      !verifiedPhone ||
      verifiedPhone !== validation.phone
    ) {
      setError(
        'Verify OTP on your mobile number before creating your account.'
      )

      setSuccess('')
      return
    }

    const users = readStorage(STORAGE_KEYS.users, [])

    const exists = users.some(
      (entry) => entry.phone === validation.phone
    )

    if (exists) {
      setError(
        'Account already exists with this mobile number.'
      )

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
            validation.phone
          )

          const existingRemoteUser =
            await getDoc(userRef)

          if (existingRemoteUser.exists()) {
            setError(
              'Account already exists with this mobile number.'
            )

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
        setError(
          dbError.message ||
            'Failed to save account in database.'
        )

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

      writeStorage(
        STORAGE_KEYS.users,
        [...users, newUser]
      )

      setError('')
      setOtpStatus('')
      setSuccess(
        'Account created successfully. Redirecting...'
      )

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
    <main className="signup-page">

      <div className="signup-bg-circle signup-bg-circle--one" />
      <div className="signup-bg-circle signup-bg-circle--two" />

      <section className="signup-wrapper">

        {/* =====================================
            LEFT BRAND PANEL
        ===================================== */}

        <div className="signup-showcase">

          <div className="signup-brand">

            <div className="signup-brand-icon">
              <ShoppingBag size={25} />
            </div>

            <div>
              <div className="signup-brand-name">
                ApanaMart
              </div>

              <div className="signup-brand-tagline">
                YOUR EVERYDAY ONLINE STORE
              </div>
            </div>

          </div>


          <div className="signup-showcase-content">

            <div className="signup-badge">
              <span className="signup-badge-dot" />
              Join ApanaMart today
            </div>

            <h1>
              Your daily shopping,
              <span>made easier.</span>
            </h1>

            <p>
              Create your account and enjoy a simple,
              convenient way to shop for everyday essentials
              from your local store.
            </p>

          </div>


          <div className="signup-benefits">

            <div className="signup-benefit">

              <div className="signup-benefit-icon">
                <Package size={18} />
              </div>

              <div>
                <strong>Everyday essentials</strong>
                <span>
                  Find what you need in one place
                </span>
              </div>

            </div>


            <div className="signup-benefit">

              <div className="signup-benefit-icon">
                <Truck size={18} />
              </div>

              <div>
                <strong>Convenient delivery</strong>
                <span>
                  Get your order delivered to you
                </span>
              </div>

            </div>


            <div className="signup-benefit">

              <div className="signup-benefit-icon">
                <ShieldCheck size={18} />
              </div>

              <div>
                <strong>Verified account</strong>
                <span>
                  Secure your account with OTP
                </span>
              </div>

            </div>

          </div>

        </div>


        {/* =====================================
            SIGNUP CARD
        ===================================== */}

        <div className="signup-card">

          <div className="signup-header">

            <div className="signup-mobile-icon">
              <UserPlus size={21} />
            </div>

            <div className="signup-label">
              CREATE ACCOUNT
            </div>

            <h2>
              Get started
            </h2>

            <p>
              Create your ApanaMart customer account.
            </p>

          </div>


          <form
            className="signup-form"
            onSubmit={handleSubmit}
          >

            {/* Name */}
            <div className="signup-form-group">

              <label htmlFor="signup-name">
                Full name
              </label>

              <div className="signup-input-wrapper">

                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={(event) =>
                    handleFormChange(
                      'name',
                      event.target.value
                    )
                  }
                />

              </div>

            </div>


            {/* Phone */}
            <div className="signup-form-group">

              <label htmlFor="signup-phone">
                Mobile number
              </label>

              <div className="signup-input-wrapper">

                <span className="signup-input-prefix">
                  +91
                </span>

                <input
                  id="signup-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="98765 43210"
                  value={form.phone}
                  onChange={(event) =>
                    handleFormChange(
                      'phone',
                      event.target.value
                    )
                  }
                />

              </div>

            </div>


            {/* Address */}
            <div className="signup-form-group">

              <label htmlFor="signup-address">
                Delivery address
              </label>

              <div className="signup-input-wrapper signup-address-wrapper">

                <MapPin
                  size={17}
                  className="signup-address-icon"
                />

                <input
                  id="signup-address"
                  type="text"
                  autoComplete="street-address"
                  placeholder="Enter your delivery address"
                  value={form.address}
                  onChange={(event) =>
                    handleFormChange(
                      'address',
                      event.target.value
                    )
                  }
                />

              </div>

            </div>


            {/* Password row */}
            <div className="signup-password-row">

              <div className="signup-form-group">

                <label htmlFor="signup-password">
                  Password
                </label>

                <div className="signup-input-wrapper">

                  <input
                    id="signup-password"
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    autoComplete="new-password"
                    placeholder="Minimum 6 characters"
                    value={form.password}
                    onChange={(event) =>
                      handleFormChange(
                        'password',
                        event.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    className="signup-password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (prev) => !prev
                      )
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>

                </div>

              </div>


              <div className="signup-form-group">

                <label htmlFor="signup-confirm-password">
                  Confirm password
                </label>

                <div className="signup-input-wrapper">

                  <input
                    id="signup-confirm-password"
                    type={
                      showConfirmPassword
                        ? 'text'
                        : 'password'
                    }
                    autoComplete="new-password"
                    placeholder="Re-enter password"
                    value={form.confirmPassword}
                    onChange={(event) =>
                      handleFormChange(
                        'confirmPassword',
                        event.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    className="signup-password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(
                        (prev) => !prev
                      )
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>

                </div>

              </div>

            </div>


            {/* OTP status */}
            {otpStatus && (
              <div
                className={`signup-status ${
                  verifiedPhone
                    ? 'signup-status--success'
                    : ''
                }`}
              >
                <ShieldCheck size={15} />
                <span>{otpStatus}</span>
              </div>
            )}


            {/* Error */}
            {error && (
              <div className="signup-error">
                <span>!</span>
                {error}
              </div>
            )}


            {/* Success */}
            {success && (
              <div className="signup-success">
                <ShieldCheck size={15} />
                {success}
              </div>
            )}


            {/* Buttons */}
            <div className="signup-buttons">

              <button
                type="button"
                className="signup-verify-button"
                onClick={startOtpVerification}
                disabled={
                  isOtpLoading ||
                  isCreatingAccount
                }
              >
                {isOtpLoading
                  ? 'Verifying...'
                  : verifiedPhone
                    ? '✓ Mobile Verified'
                    : 'Verify Mobile'}
              </button>


              <button
                type="submit"
                className="signup-create-button"
                disabled={
                  isCreatingAccount ||
                  isOtpLoading
                }
              >
                {isCreatingAccount ? (
                  <>
                    <span className="signup-spinner" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Create Account
                  </>
                )}
              </button>

            </div>

          </form>


          {/* Login */}
          <div className="signup-divider">
            <span>Already have an account?</span>
          </div>

          <NavLink
            to="/login"
            className="signup-login-button"
          >
            Login to ApanaMart
          </NavLink>


          <p className="signup-security-note">
            <ShieldCheck size={13} />
            Your mobile number is verified using OTP
          </p>

        </div>

      </section>


      <footer className="signup-footer">
        © {new Date().getFullYear()} ApanaMart · Your Everyday Online Store
      </footer>

    </main>
  )
}

export default SignupPage