const configuredApiBase = String(import.meta.env.VITE_API_BASE_URL || 'http://localhost/paintings/api').trim()

export const API_BASE_URL = configuredApiBase.replace(/\/$/, '')

export function apiUrl(path) {
  const normalizedPath = String(path || '').replace(/^\//, '')
  return `${API_BASE_URL}/${normalizedPath}`
}
