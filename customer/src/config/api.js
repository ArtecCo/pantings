const configuredApiBase = String(import.meta.env.VITE_API_BASE_URL || '').trim()

export const API_BASE_URL = configuredApiBase.replace(/\/$/, '')

export function apiUrl(path) {
  const normalizedPath = String(path || '').replace(/^\//, '')
  if (!API_BASE_URL) {
    throw new Error('API base URL is not configured.')
  }
  return `${API_BASE_URL}/${normalizedPath}`
}
