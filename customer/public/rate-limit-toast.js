(() => {
  'use strict'

  const TOAST_ID = 'ara-rate-limit-toast'
  let hideTimer = null

  function showRateLimitToast(message, retryAfter) {
    let toast = document.getElementById(TOAST_ID)

    if (!toast) {
      toast = document.createElement('div')
      toast.id = TOAST_ID
      toast.setAttribute('role', 'status')
      toast.setAttribute('aria-live', 'polite')
      Object.assign(toast.style, {
        position: 'fixed',
        left: '50%',
        bottom: '24px',
        transform: 'translateX(-50%) translateY(12px)',
        zIndex: '2147483647',
        maxWidth: 'min(92vw, 460px)',
        padding: '13px 18px',
        borderRadius: '12px',
        background: '#3f3030',
        color: '#fff',
        boxShadow: '0 10px 30px rgba(0,0,0,.22)',
        font: '600 14px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        textAlign: 'center',
        opacity: '0',
        transition: 'opacity .2s ease, transform .2s ease',
        pointerEvents: 'none'
      })
      document.body.appendChild(toast)
    }

    const wait = Number(retryAfter)
    toast.textContent = wait > 0
      ? `${message} Please try again in ${wait} second${wait === 1 ? '' : 's'}.`
      : message

    requestAnimationFrame(() => {
      toast.style.opacity = '1'
      toast.style.transform = 'translateX(-50%) translateY(0)'
    })

    clearTimeout(hideTimer)
    hideTimer = setTimeout(() => {
      toast.style.opacity = '0'
      toast.style.transform = 'translateX(-50%) translateY(12px)'
    }, 4500)
  }

  const originalFetch = window.fetch
  if (typeof originalFetch === 'function') {
    window.fetch = async function (...args) {
      const response = await originalFetch.apply(this, args)

      if (response.status === 429) {
        let payload = null
        try {
          payload = await response.clone().json()
        } catch (_) {}

        showRateLimitToast(
          payload?.message || 'Too many requests. Please wait a moment and try again.',
          payload?.retry_after || response.headers.get('Retry-After') || 0
        )
      }

      return response
    }
  }
})()
