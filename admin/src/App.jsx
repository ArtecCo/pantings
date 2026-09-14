import { useEffect, useState } from 'react'
import { ToastProvider } from './components/Toast'
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom'
import AdminLogin from './pages/AdminLogin'
import Paintings from './pages/Paintings'
import AddPainting from './pages/AddPainting'
import Metadata from './pages/Metadata'
import PaintingList from './pages/PaintingList'
import EditPainting from './pages/EditPainting'
import Orders from './pages/Orders'
import OrderDetails from './pages/OrderDetails'
import OrderStatusManager from './pages/OrderStatusManager'
import { apiUrl } from './config/api'
import './App.css'
import './pages/Orders.css'
import './pages/OrderDetails.css'

const menuItems = [
  { label: 'Dashboard', icon: '⌂', path: '/' }, { label: 'Orders', icon: '◇', path: '/orders' },
  { label: 'Paintings', icon: '▧', path: '/paintings' }, { label: 'Customers', icon: '♙', path: '/customers' },
  { label: 'Payments', icon: '₹', path: '/payments' }, { label: 'Reports', icon: '▤', path: '/reports' },
  { label: 'Metadata', icon: '◇', path: '/metadata' },
]
const managementItems = [
  { label: 'Administrators', icon: '♙', path: '/administrators' }, { label: 'Audit Log', icon: '◌', path: '/audit' },
  { label: 'Settings', icon: '⚙', path: '/settings' },
]

function AdminLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)
  const handleLogout = async () => {
    try { await fetch(apiUrl('admin/logout.php'), { method: 'POST', credentials: 'include' }) }
    catch (error) { console.error('Logout failed:', error) }
    window.location.replace('/login')
  }
  return <div className="admin-app">
    <header className="admin-topbar"><div className="admin-brand"><button className="mobile-menu-button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><span /><span /><span /></button><div className="brand-monogram">A</div><div><div className="brand-name">ARAmane Arts</div><div className="brand-subtitle">HERITAGE PAINTINGS</div></div></div><div className="admin-topbar-right"><span className="admin-role">SUPER ADMIN</span><div className="admin-profile"><div className="profile-avatar">A</div><div><strong>Administrator</strong><small>Administrator</small></div></div><button className="logout-button" onClick={handleLogout}>Logout</button></div></header>
    <div className="admin-body">{menuOpen && <div className="sidebar-backdrop" onClick={closeMenu} />}<aside className={`admin-sidebar ${menuOpen ? 'mobile-open' : ''}`}><button className="mobile-sidebar-close" onClick={closeMenu} aria-label="Close menu">×</button><div className="sidebar-heading">ATELIER MANAGEMENT</div><nav>{menuItems.map(item => <NavLink key={item.path} to={item.path} end={item.path === '/'} onClick={closeMenu} className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}><span className="nav-icon">{item.icon}</span><span>{item.label}</span></NavLink>)}</nav><div className="sidebar-divider" /><div className="sidebar-heading">ADMINISTRATION</div><nav>{managementItems.map(item => <NavLink key={item.path} to={item.path} onClick={closeMenu} className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}><span className="nav-icon">{item.icon}</span><span>{item.label}</span></NavLink>)}</nav><div className="sidebar-footer"><div className="sidebar-ornament">✦</div><div>ARAmane Arts</div><small>Preserving Indian Heritage</small></div></aside><main className="admin-content">{children}</main></div>
  </div>
}
function Dashboard() { return <AdminLayout><div className="page-header"><div><span className="eyebrow">ATELIER OVERVIEW</span><h1>Dashboard</h1><p>Welcome back. Here is today's overview of ARAmane Arts.</p></div><button className="gold-outline-button">+ Add Painting</button></div><div className="gold-rule" /><section className="dashboard-stats"><div className="heritage-card stat-card"><span className="stat-label">PENDING ORDERS</span><strong>0</strong><span className="stat-note">Awaiting artist acceptance</span></div><div className="heritage-card stat-card"><span className="stat-label">PAINTINGS</span><strong>0</strong><span className="stat-note">Currently in collection</span></div><div className="heritage-card stat-card"><span className="stat-label">CUSTOMERS</span><strong>1</strong><span className="stat-note">Registered customers</span></div><div className="heritage-card stat-card"><span className="stat-label">REVENUE</span><strong>₹0</strong><span className="stat-note">No completed payments yet</span></div></section><section className="dashboard-grid"><div className="heritage-card large-card"><div className="card-heading"><div><span className="eyebrow">ORDERS</span><h2>Recent Orders</h2></div><button className="text-button">View all →</button></div><div className="empty-state"><div className="empty-symbol">◇</div><h3>No orders yet</h3><p>Customer orders will appear here once they are placed.</p></div></div><div className="heritage-card activity-card"><div className="card-heading"><div><span className="eyebrow">SYSTEM</span><h2>Recent Activity</h2></div></div><div className="activity-item"><div className="activity-dot" /><div><strong>Admin portal initialized</strong><span>System ready</span></div></div><div className="activity-item"><div className="activity-dot" /><div><strong>Authentication enabled</strong><span>Email + password + OTP</span></div></div></div></section><section className="craft-strip"><div className="craft-item"><span>01</span><div><strong>TRADITION</strong><small>Rooted in Indian artistry</small></div></div><div className="craft-item"><span>02</span><div><strong>CRAFTSMANSHIP</strong><small>Handcrafted with devotion</small></div></div><div className="craft-item"><span>03</span><div><strong>HERITAGE</strong><small>Art that carries a story</small></div></div></section></AdminLayout> }
function PlaceholderPage({ title }) { return <AdminLayout><div className="page-header"><div><span className="eyebrow">ARAMANE ARTS</span><h1>{title}</h1><p>This section will be connected to the marketplace API next.</p></div></div><div className="gold-rule" /><div className="heritage-card placeholder-card"><div className="empty-state"><div className="empty-symbol">✦</div><h3>{title}</h3><p>Management tools for this section are coming next.</p></div></div></AdminLayout> }
function ProtectedRoute({ children }) {
  const [state, setState] = useState('checking')
  useEffect(() => {
    let mounted = true
    fetch(apiUrl('auth/admin-session.php'), { method: 'GET', credentials: 'include' })
      .then(async response => { const data = await response.json().catch(() => ({})); if (!mounted) return; setState(response.ok && data.success === true && data.authenticated === true && data.two_factor_verified === true ? 'authenticated' : 'unauthenticated') })
      .catch(error => { console.error('Administrator session check failed:', error); if (mounted) setState('unauthenticated') })
    return () => { mounted = false }
  }, [])
  if (state === 'checking') return <div className="admin-app"><div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5b1217', fontFamily: 'Cormorant Garamond, serif', fontSize: '22px' }}>Checking administrator access…</div></div>
  return state === 'authenticated' ? children : <Navigate to="/login" replace />
}
function App() { return <ToastProvider><BrowserRouter><Routes><Route path="/login" element={<AdminLogin />} /><Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /><Route path="/orders" element={<ProtectedRoute><AdminLayout><Orders /></AdminLayout></ProtectedRoute>} /><Route path="/orders/:id" element={<ProtectedRoute><AdminLayout><OrderStatusManager /><OrderDetails /></AdminLayout></ProtectedRoute>} /><Route path="/paintings" element={<ProtectedRoute><AdminLayout><PaintingList /></AdminLayout></ProtectedRoute>} /><Route path="/paintings/:id/edit" element={<ProtectedRoute><AdminLayout><EditPainting /></AdminLayout></ProtectedRoute>} /><Route path="/paintings/new" element={<ProtectedRoute><AdminLayout><AddPainting /></AdminLayout></ProtectedRoute>} /><Route path="/metadata" element={<ProtectedRoute><AdminLayout><Metadata /></AdminLayout></ProtectedRoute>} />{managementItems.concat(menuItems.filter(item => !['/','/orders','/paintings','/metadata'].includes(item.path))).map(item => <Route key={item.path} path={item.path} element={<ProtectedRoute><PlaceholderPage title={item.label} /></ProtectedRoute>} />)}<Route path="*" element={<Navigate to="/" replace />} /></Routes></BrowserRouter></ToastProvider> }
export default App
