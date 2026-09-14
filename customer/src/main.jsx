import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './responsive.css'
import './fixes.css'
import './animations.css'
import App from './App.jsx'
import { ToastProvider } from './components/ToastProvider.jsx'

if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

const resetScrollPosition = () => window.scrollTo(0, 0)
resetScrollPosition()
window.addEventListener('load', resetScrollPosition, { once: true })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
)
