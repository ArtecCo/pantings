import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './animations.css'
import './painting-size-options.css'
import './unavailable-paintings.css'
import './painting-size-enhancer.js'
import './dashboard-enhancer.js'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
