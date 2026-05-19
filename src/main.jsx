import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  const canRegisterServiceWorker =
    import.meta.env.PROD ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'

  if (canRegisterServiceWorker) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {})
    })
  }
}
