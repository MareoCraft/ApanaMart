let otpLoaderPromise = null

export function normalizePhone(value) {
  const text = String(value || '').trim()
  if (!text) return ''

  const plus = text.startsWith('+')
  const digits = text.replace(/\D/g, '')

  if (digits.length < 10) return ''
  return plus ? `+${digits}` : digits
}

function findStringValueDeep(input, keys, seen = new Set()) {
  if (!input || typeof input !== 'object') return ''
  if (seen.has(input)) return ''
  seen.add(input)

  for (const [key, value] of Object.entries(input)) {
    if (
      keys.includes(String(key).toLowerCase()) &&
      typeof value === 'string' &&
      value.trim()
    ) {
      return value.trim()
    }
  }

  for (const value of Object.values(input)) {
    if (value && typeof value === 'object') {
      const nested = findStringValueDeep(value, keys, seen)
      if (nested) return nested
    }
  }

  return ''
}

export function extractToken(payload) {
  return findStringValueDeep(payload, [
    'token',
    'accesstoken',
    'access_token',
    'jwt',
    'jwttoken',
    'auth_token',
    'verificationtoken',
    'access-token',
  ])
}

export function extractPhone(payload) {
  return findStringValueDeep(payload, [
    'mobile',
    'phone',
    'identifier',
    'number',
    'mobile_number',
    'phone_number',
  ])
}

export function loadOtpScript(authConfig) {
  if (typeof window.initSendOTP === 'function') {
    return Promise.resolve()
  }

  if (otpLoaderPromise) {
    return otpLoaderPromise
  }

  otpLoaderPromise = new Promise((resolve, reject) => {
    let index = 0

    const tryNext = () => {
      if (index >= authConfig.otpScriptUrls.length) {
        reject(new Error('OTP widget failed to load'))
        return
      }

      const script = document.createElement('script')
      script.src = authConfig.otpScriptUrls[index]
      script.async = true

      script.onload = () => {
        if (typeof window.initSendOTP === 'function') {
          resolve()
        } else {
          index += 1
          tryNext()
        }
      }

      script.onerror = () => {
        index += 1
        tryNext()
      }

      document.head.appendChild(script)
    }

    tryNext()
  })

  return otpLoaderPromise
}
