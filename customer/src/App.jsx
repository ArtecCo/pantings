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

const COLLECTION_SCROLL_KEY = 'ara-collection-scroll'

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
