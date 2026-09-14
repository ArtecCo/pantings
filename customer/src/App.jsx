import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Paintings from './pages/Paintings'
import PaintingDetails from './pages/PaintingDetails'
import Login from './pages/Login'
import Account from './pages/Account'
import Cart from './pages/Cart'
import TrackOrders from './pages/TrackOrders'
import Layout from './components/Layout'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/paintings" element={<Paintings />} />
          <Route path="/paintings/:id" element={<PaintingDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/account" element={<Account />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/track-orders" element={<TrackOrders />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
