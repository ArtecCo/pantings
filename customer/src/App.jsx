import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigationType } from 'react-router-dom'
import Home from './pages/Home'
import Paintings from './pages/Paintings'
import PaintingDetails from './pages/PaintingDetails'
import Login from './pages/Login'
import Account from './pages/Account'
import Cart from './pages/Cart'
import TrackOrders from './pages/TrackOrders'
import OrderDetails from './pages/OrderDetails'
import Layout from './components/Layout'
import { ToastProvider } from './components/ToastProvider'
import { apiUrl } from './config/api'

const SITE_NAME = 'ARAmane Arts'
const DEFAULT_DESCRIPTION = 'Original Thanjavur paintings handcrafted with devotion and heritage.'
const COLLECTION_SCROLL_KEY = 'ara-collection-scroll'

function setMeta(name, content) {
  let element = document.head.querySelector(`meta[name="${name}"]`)
  if (!element) { element = document.createElement('meta'); element.setAttribute('name', name); document.head.appendChild(element) }
  element.setAttribute('content', content)
}
function setProperty(property, content) {
  let element = document.head.querySelector(`meta[property="${property}"]`)
  if (!element) { element = document.createElement('meta'); element.setAttribute('property', property); document.head.appendChild(element) }
  element.setAttribute('content', content)
}
function setCanonical(url) {
  let element = document.head.querySelector('link[rel="canonical"]')
  if (!element) { element = document.createElement('link'); element.setAttribute('rel', 'canonical'); document.head.appendChild(element) }
  element.setAttribute('href', url)
}
function getImageUrl(url) { if (!url) return ''; if (url.startsWith('http')) return url; return `${window.location.origin}${url}` }

function MetadataManager() {
  const location = useLocation()
  useEffect(() => {
    let cancelled = false
    const origin = window.location.origin
    const canonicalUrl = `${origin}${location.pathname}${location.search}`
    const applyDefaults = () => {
      if (cancelled) return
      document.title = location.pathname === '/' ? SITE_NAME : `${SITE_NAME} — ${location.pathname.startsWith('/paintings') ? 'Collection' : 'Account'}`
      setMeta('description', DEFAULT_DESCRIPTION); setProperty('og:site_name', SITE_NAME); setProperty('og:type', 'website'); setProperty('og:title', document.title); setProperty('og:description', DEFAULT_DESCRIPTION); setProperty('og:url', canonicalUrl); setMeta('twitter:card', 'summary_large_image'); setMeta('twitter:title', document.title); setMeta('twitter:description', DEFAULT_DESCRIPTION); setCanonical(canonicalUrl)
    }
    applyDefaults()
    const match = location.pathname.match(/^\/paintings\/([^/]+)$/)
    if (!match) return () => { cancelled = true }
    const loadPaintingMetadata = async () => {
      try {
        const response = await fetch(apiUrl(`paintings/get.php?id=${encodeURIComponent(match[1])}`))
        const data = await response.json().catch(() => ({})); const painting = data.painting || data.data
        if (cancelled || !response.ok || !data.success || !painting) return
        const title = painting.name ? `${painting.name} | ${SITE_NAME}` : SITE_NAME
        const description = painting.description || `Discover ${painting.name || 'this original Thanjavur painting'} from ${SITE_NAME}.`
        const image = getImageUrl((painting.images?.[0]?.image_url) || painting.image_url)
        document.title = title; setMeta('description', description); setProperty('og:type', 'product'); setProperty('og:title', title); setProperty('og:description', description); setProperty('og:url', canonicalUrl)
        if (image) { setProperty('og:image', image); setProperty('og:image:alt', painting.name || SITE_NAME); setMeta('twitter:image', image) }
        setMeta('twitter:card', 'summary_large_image'); setMeta('twitter:title', title); setMeta('twitter:description', description); setCanonical(canonicalUrl)
      } catch { }
    }
    loadPaintingMetadata(); return () => { cancelled = true }
  }, [location.pathname, location.search])
  return null
}

function ScrollManager() {
  const location = useLocation(); const navigationType = useNavigationType()
  useEffect(() => {
    const isCollection = location.pathname === '/paintings'; const savedScroll = sessionStorage.getItem(COLLECTION_SCROLL_KEY)
    if (isCollection && navigationType === 'POP' && savedScroll !== null) { const scrollY = Number(savedScroll); sessionStorage.removeItem(COLLECTION_SCROLL_KEY); requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, Number.isFinite(scrollY) ? scrollY : 0))); return undefined }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); return undefined
  }, [location.pathname, navigationType])
  useEffect(() => { if (location.pathname !== '/paintings') return undefined; return () => { sessionStorage.setItem(COLLECTION_SCROLL_KEY, String(window.scrollY || window.pageYOffset || 0)) } }, [location.pathname])
  return null
}

function MaintenanceGate() {
  const [maintenance, setMaintenance] = useState(null)
  const [retryTick, setRetryTick] = useState(0)
  useEffect(() => {
    let active = true
    const check = async () => {
      try {
        const response = await fetch(apiUrl('system/maintenance.php'), { method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store' })
        const data = await response.json().catch(() => ({}))
        if (active) setMaintenance(response.ok && data.success === true && data.maintenance_mode === true)
      } catch {
        if (active) setMaintenance(false)
      }
    }
    check()
    const timer = window.setInterval(check, 15000)
    return () => { active = false; window.clearInterval(timer) }
  }, [retryTick])
  if (maintenance === null) return <div className="ara-maintenance-loading" aria-label="Loading"><span>ARAmane Arts</span></div>
  if (!maintenance) return null
  return <div className="ara-maintenance-screen" role="alertdialog" aria-modal="true">
    <div className="ara-maintenance-inner">
      <span className="ara-maintenance-eyebrow">ARAmane Arts</span>
      <div className="ara-maintenance-mark">A</div>
      <h1>We are preparing something beautiful.</h1>
      <div className="ara-maintenance-rule" />
      <p>Our website is temporarily unavailable while we carry out scheduled work. We will be back shortly.</p>
      <span className="ara-maintenance-note">Thank you for your patience.</span>
      <button type="button" className="ara-maintenance-retry" onClick={() => setRetryTick(value => value + 1)}>Check again</button>
    </div>
    <style>{`.ara-maintenance-screen{position:fixed;inset:0;z-index:2147483647;background:#faf6ee;color:#5b1217;display:flex;align-items:center;justify-content:center;min-height:100dvh;width:100vw;text-align:center;padding:24px;box-sizing:border-box}.ara-maintenance-inner{width:min(620px,100%);display:flex;flex-direction:column;align-items:center}.ara-maintenance-eyebrow{font:600 10px/1.2 'DM Sans',sans-serif;letter-spacing:.32em;text-transform:uppercase;color:#b18d2d}.ara-maintenance-mark{width:72px;height:72px;margin:28px 0 24px;border:1px solid rgba(91,18,23,.2);border-radius:50%;display:grid;place-items:center;font:400 42px/1 'Cormorant Garamond',serif}.ara-maintenance-inner h1{margin:0;max-width:580px;font:400 clamp(38px,7vw,68px)/.95 'Cormorant Garamond',serif;letter-spacing:-.02em}.ara-maintenance-rule{width:74px;height:1px;background:#d4af37;margin:28px 0}.ara-maintenance-inner p{margin:0;max-width:490px;font:400 15px/1.8 'DM Sans',sans-serif;color:#6e5b53}.ara-maintenance-note{margin-top:18px;font:500 11px/1.5 'DM Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#8c7569}.ara-maintenance-retry{margin-top:28px;border:1px solid rgba(91,18,23,.25);background:transparent;color:#5b1217;padding:11px 18px;font:600 10px/1 'DM Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}.ara-maintenance-retry:hover{background:#5b1217;color:#faf6ee}.ara-maintenance-loading{position:fixed;inset:0;z-index:2147483647;background:#faf6ee;display:grid;place-items:center;color:#5b1217;font:400 24px 'Cormorant Garamond',serif}`}</style>
  </div>
}

function App() {
  return (
    <BrowserRouter>
      <MaintenanceGate />
      <MetadataManager />
      <ScrollManager />
      <ToastProvider><Layout><Routes><Route path="/" element={<Home />} /><Route path="/paintings" element={<Paintings />} /><Route path="/paintings/:id" element={<PaintingDetails />} /><Route path="/login" element={<Login />} /><Route path="/account" element={<Account />} /><Route path="/cart" element={<Cart />} /><Route path="/track-orders" element={<TrackOrders />} /><Route path="/track-orders/:id" element={<OrderDetails />} /></Routes></Layout></ToastProvider>
    </BrowserRouter>
  )
}
export default App
