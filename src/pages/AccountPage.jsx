import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useStore } from '../context/StoreContext'

function AccountPage({ session, onLogout }) {
  const navigate = useNavigate()
  const { profile, setProfile, saveAccount } = useStore()
  const [isSaving, setIsSaving] = useState(false)
  const [installPromptEvent, setInstallPromptEvent] = useState(null)
  const [installMessage, setInstallMessage] = useState('')
  const [isInstalled, setIsInstalled] = useState(false)
  const safeSession = session || {}

  const effectiveProfile = {
    name: profile.name || safeSession.name || '',
    phone: profile.phone || safeSession.phone || '',
    address: profile.address || safeSession.address || '',
    landmark: profile.landmark || '',
    note: profile.note || '',
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSaving) return

    setIsSaving(true)
    await saveAccount()
    setIsSaving(false)
  }

  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia?.('(display-mode: standalone)').matches ||
        window.navigator.standalone === true
      setIsInstalled(Boolean(isStandalone))
      if (isStandalone) {
        setInstallMessage('App is already installed.')
      }
    }

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setInstallPromptEvent(event)
      setInstallMessage('Install app for quick access from your home screen.')
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPromptEvent(null)
      setInstallMessage('App installed successfully.')
    }

    checkInstalled()
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isInstalled) {
      setInstallMessage('App is already installed.')
      return
    }

    if (!installPromptEvent) {
      setInstallMessage('Install is not available yet on this browser/device.')
      return
    }

    installPromptEvent.prompt()
    const choiceResult = await installPromptEvent.userChoice

    if (choiceResult?.outcome === 'accepted') {
      setInstallMessage('Installing app...')
    } else {
      setInstallMessage('Install cancelled.')
    }

    setInstallPromptEvent(null)
  }

  return (
    <section className="account-panel modern-account-panel">
      <article className="profile-summary-card">
        <div className="profile-avatar">{effectiveProfile.name?.[0] || 'U'}</div>
        <div>
          <h3>{effectiveProfile.name || 'Guest User'}</h3>
          <p>{effectiveProfile.phone || 'No phone number'}</p>
        </div>
      </article>

      <form onSubmit={handleSubmit} className="modern-account-form">
        <label htmlFor="name">Full Name</label>
        <input
          id="name"
          value={effectiveProfile.name}
          onChange={(event) =>
            setProfile((prev) => ({ ...prev, name: event.target.value }))
          }
          placeholder="Enter full name"
        />

        <label htmlFor="phone">Mobile Number</label>
        <input
          id="phone"
          disabled
          value={effectiveProfile.phone}
          onChange={(event) =>
            setProfile((prev) => ({ ...prev, phone: event.target.value }))
          }
          placeholder="+919876543210"
        />

        <label htmlFor="address">Address</label>
        <textarea
          id="address"
          rows="3"
          value={effectiveProfile.address}
          onChange={(event) =>
            setProfile((prev) => ({ ...prev, address: event.target.value }))
          }
          placeholder="House no, street, area"
        ></textarea>

        <label htmlFor="landmark">Landmark</label>
        <input
          id="landmark"
          value={effectiveProfile.landmark}
          onChange={(event) =>
            setProfile((prev) => ({ ...prev, landmark: event.target.value }))
          }
          placeholder="Near temple, school, etc"
        />

        <label htmlFor="note">Delivery Note</label>
        <textarea
          id="note"
          rows="2"
          value={effectiveProfile.note}
          onChange={(event) =>
            setProfile((prev) => ({ ...prev, note: event.target.value }))
          }
          placeholder="Call before arrival"
        ></textarea>

        <div className="account-actions-bottom">
          <button type="submit" className="save-btn account-update-btn" disabled={isSaving}>
            {isSaving ? 'Updating...' : 'Update Details'}
          </button>
          <button
            type="button"
            className="account-install-btn"
            onClick={handleInstallClick}
            disabled={isInstalled}
          >
            {isInstalled ? 'App Installed' : 'Install App'}
          </button>
          {installMessage && <p className="account-install-note">{installMessage}</p>}
          <button
            type="button"
            className="account-logout-btn"
            onClick={() => {
              if (onLogout) {
                onLogout()
                return
              }
              navigate('/login', { replace: true })
            }}
          >
            Logout
          </button>
        </div>
      </form>
    </section>
  )
}

export default AccountPage
