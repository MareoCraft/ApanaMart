export function readStorage(key, fallbackValue) {
  const raw = localStorage.getItem(key)
  if (!raw) return fallbackValue

  try {
    const parsed = JSON.parse(raw)
    return parsed ?? fallbackValue
  } catch {
    return fallbackValue
  }
}

export function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}
