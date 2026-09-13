import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Paintings from './pages/Paintings'
import PaintingDetails from './pages/PaintingDetails'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/paintings" element={<Paintings />} />
        <Route path="/paintings/:id" element={<PaintingDetails />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App