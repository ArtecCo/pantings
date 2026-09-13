import { createContext, useContext, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = (id) => {
    setToasts(current =>
      current.filter(toast => toast.id !== id)
    )
  }

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random()

    setToasts(current => [
      ...current,
      {
        id,
        message,
        type
      }
    ])

    setTimeout(() => {
      removeToast(id)
    }, 4000)
  }

  const toast = {
    success: (message) => showToast(message, 'success'),
    error: (message) => showToast(message, 'error'),
    warning: (message) => showToast(message, 'warning'),
    info: (message) => showToast(message, 'info')
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      <div className="ara-toast-viewport">
        {toasts.map(item => (
          <div
            key={item.id}
            className={`ara-toast ara-toast-${item.type}`}
          >
            <div className="ara-toast-icon">
              {item.type === 'success' && '✓'}
              {item.type === 'error' && '×'}
              {item.type === 'warning' && '!'}
              {item.type === 'info' && 'i'}
            </div>

            <div className="ara-toast-content">
              <div className="ara-toast-title">
                {item.type === 'success' && 'Success'}
                {item.type === 'error' && 'Something went wrong'}
                {item.type === 'warning' && 'Please check'}
                {item.type === 'info' && 'ARAmane Arts'}
              </div>

              <div className="ara-toast-message">
                {item.message}
              </div>
            </div>

            <button
              type="button"
              className="ara-toast-close"
              onClick={() => removeToast(item.id)}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error(
      'useToast must be used inside ToastProvider'
    )
  }

  return context
}