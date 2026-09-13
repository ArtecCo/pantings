import { useEffect } from 'react'

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return

    const timer = setTimeout(() => {
      onClose()
    }, 4000)

    return () => clearTimeout(timer)
  }, [toast, onClose])

  if (!toast) return null

  return (
    <div className={`ara-toast ara-toast-${toast.type || 'success'}`}>

      <div className="ara-toast-icon">
        {toast.type === 'error'
          ? '!'
          : toast.type === 'warning'
            ? '!'
            : toast.type === 'info'
              ? 'i'
              : '✦'}
      </div>

      <div className="ara-toast-body">
        {toast.title && (
          <div className="ara-toast-title">
            {toast.title}
          </div>
        )}

        <div className="ara-toast-message">
          {toast.message}
        </div>
      </div>

      <button
        type="button"
        className="ara-toast-close"
        onClick={onClose}
        aria-label="Close notification"
      >
        ×
      </button>

    </div>
  )
}