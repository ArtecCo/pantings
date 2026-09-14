import { apiUrl } from './config/api'

const updateCartCount = async () => {
  const badge = document.querySelector('.ara-cart-count')
  if (!badge) return
  try {
    const response = await fetch(apiUrl('cart/get.php'), { credentials: 'include' })
    if (response.status === 401) {
      badge.textContent = '0'
      return
    }
    const data = await response.json().catch(() => ({}))
    if (!response.ok || !data.success) return
    const items = Array.isArray(data.items) ? data.items : []
    badge.textContent = String(items.length)
  } catch {
    // Keep the last known count if the cart endpoint is temporarily unavailable.
  }
}

const isCartMutation = request => {
  try {
    const url = typeof request === 'string' ? request : request?.url
    const pathname = new URL(url, window.location.href).pathname
    return /\/cart\/(add-item|remove-item|update-item)\.php$/.test(pathname)
  } catch {
    return false
  }
}

const nativeFetch = window.fetch.bind(window)
window.fetch = async (...args) => {
  const response = await nativeFetch(...args)
  if (isCartMutation(args[0]) && response.ok) {
    window.setTimeout(updateCartCount, 0)
  }
  return response
}

window.addEventListener('ara-cart-updated', updateCartCount)
window.addEventListener('load', updateCartCount)
window.setTimeout(updateCartCount, 0)
