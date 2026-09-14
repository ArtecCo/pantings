import { useEffect } from 'react'
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

const API = 'http://localhost/paintings/api'
const SITE_NAME = 'ARAmane Arts'
const DEFAULT_DESCRIPTION = 'Original Thanjavur paintings handcrafted with devotion and heritage.'
const COLLECTION_SCROLL_KEY = 'ara-collection-scroll'

function setMeta(name, content) {
  let element = document.head.querySelector(`meta[name="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('name', name)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function setProperty(property, content) {
  let element = document.head.querySelector(`meta[property="${property}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('property', property)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function setCanonical(url) {
  let element = document.head.querySelector('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.appendChild(element)
  }
  element.setAttribute('href', url)
}

function getImageUrl(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${window.location.origin}${url}`
}

function MetadataManager() {
  const location = useLocation()

  useEffect(() => {
    let cancelled = false
    const origin = window.location.origin
    const canonicalUrl = `${origin}${location.pathname}${location.search}`

    const applyDefaults = () => {
      if (cancelled) return
      document.title = location.pathname === '/' ? SITE_NAME : `${SITE_NAME} — ${location.pathname.startsWith('/paintings') ? 'Collection' : 'Account'}`
      setMeta('description', DEFAULT_DESCRIPTION)
      setProperty('og:site_name', SITE_NAME)
      setProperty('og:type', 'website')
      setProperty('og:title', document.title)
      setProperty('og:description', DEFAULT_DESCRIPTION)
      setProperty('og:url', canonicalUrl)
      setMeta('twitter:card', 'summary_large_image')
      setMeta('twitter:title', document.title)
      setMeta('twitter:description', DEFAULT_DESCRIPTION)
      setCanonical(canonicalUrl)
    }

    applyDefaults()

    const match = location.pathname.match(/^\/paintings\/([^/]+)$/)
    if (!match) return () => { cancelled = true }

    const loadPaintingMetadata = async () => {
      try {
        const response = await fetch(`${API}/paintings/get.php?id=${encodeURIComponent(match[1])}`)
        const data = await response.json().catch(() => ({}))
        const painting = data.painting || data.data
        if (cancelled || !response.ok || !data.success || !painting) return

        const title = painting.name ? `${painting.name} | ${SITE_NAME}` : SITE_NAME
        const description = painting.description || `Discover ${painting.name || 'this original Thanjavur painting'} from ${SITE_NAME}.`
        const image = getImageUrl((painting.images?.[0]?.image_url) || painting.image_url)

        document.title = title
        setMeta('description', description)
        setProperty('og:type', 'product')
        setProperty('og:title', title)
        setProperty('og:description', description)
        setProperty('og:url', canonicalUrl)
        if (image) {
          setProperty('og:image', image)
          setProperty('og:image:alt', painting.name || SITE_NAME)
          setMeta('twitter:image', image)
        }
        setMeta('twitter:card', 'summary_large_image')
        setMeta('twitter:title', title)
        setMeta('twitter:description', description)
        setCanonical(canonicalUrl)
      } catch {
        // Keep the branded defaults when metadata lookup fails.
      }
    }

    loadPaintingMetadata()
    return () => { cancelled = true }
  }, [location.pathname, location.search])

  return null
}

function ScrollManager() {
  const location = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    const isCollection = location.pathname === '/paintings'
    const savedScroll = sessionStorage.getItem(COLLECTION_SCROLL_KEY)

    if (isCollection && navigationType === 'POP' && savedScroll !== null) {
      const scrollY = Number(savedScroll)
      sessionStorage.removeItem(COLLECTION_SCROLL_KEY)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => window.scrollTo(0, Number.isFinite(scrollY) ? scrollY : 0))
      })
      return undefined
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    return undefined
  }, [location.pathname, navigationType])

  useEffect(() => {
    if (location.pathname !== '/paintings') return undefined

    return () => {
      sessionStorage.setItem(COLLECTION_SCROLL_KEY, String(window.scrollY || window.pageYOffset || 0))
    }
  }, [location.pathname])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <MetadataManager />
      <ScrollManager />
      <ToastProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/paintings" element={<Paintings />} />
            <Route path="/paintings/:id" element={<PaintingDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/account" element={<Account />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/track-orders" element={<TrackOrders />} />
            <Route path="/track-orders/:id" element={<OrderDetails />} />
          </Routes>
        </Layout>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
