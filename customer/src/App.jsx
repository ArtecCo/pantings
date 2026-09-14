import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Paintings from './pages/Paintings'
import PaintingDetails from './pages/PaintingDetails'
import Login from './pages/Login'
import Account from './pages/Account'
import Cart from './pages/Cart'
import Layout from './components/Layout'
import { ToastProvider } from './components/ToastProvider'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/paintings" element={<Paintings />} />
            <Route path="/paintings/:id" element={<PaintingDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/account" element={<Account />} />
            <Route path="/cart" element={<Cart />} />
          </Routes>
        </Layout>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
