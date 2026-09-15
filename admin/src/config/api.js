const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
const localHost = hostname === 'localhost' || hostname === '127.0.0.1'
const localApiBase = String(import.meta.env.VITE_API_BASE_URL || 'http://localhost/paintings/api').trim()

// Production must never inherit a localhost build-time override.
export const API_BASE_URL = (localHost ? localApiBase : 'https://api.arts.araha.co.in').replace(/\/$/, '')

export function apiUrl(path) {
  const normalizedPath = String(path || '').replace(/^\//, '')
  return `${API_BASE_URL}/${normalizedPath}`
}
