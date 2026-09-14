import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import { apiUrl } from '../config/api'
import './Orders.css'

const statusLabels = { PENDING_ACCEPTANCE: 'Pending Acceptance', ACCEPTED: 'Accepted', PAYMENT_DUE: 'Payment Due', PAID: 'Paid', PROCESSING: 'Processing', DISPATCHED: 'Dispatched', DELIVERED: 'Delivered', REJECTED: 'Rejected', CANCELLED: 'Cancelled' }
const statusClasses = { PENDING_ACCEPTANCE: 'pending', ACCEPTED: 'accepted', PAYMENT_DUE: 'payment-due', PAID: 'paid', PROCESSING: 'processing', DISPATCHED: 'dispatched', DELIVERED: 'delivered', REJECTED: 'rejected', CANCELLED: 'cancelled' }

export default function Orders() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')

  const loadOrders = async () => {
    setLoading(true); setError('')
    try {
      const response = await fetch(apiUrl('orders/list.php'), { credentials: 'include', headers: { Accept: 'application/json' } })
      const data = await response.json().catch(() => ({}))
      if (response.status === 401) { navigate('/login', { replace: true }); return }
      if (!response.ok || !data.success) throw new Error(data.message || 'Unable to load orders')
      setOrders(data.orders || [])
    } catch (err) {
      console.error('Orders loading error:', err); setError(err.message || 'Unable to connect to the server'); toast.error(err.message || 'Unable to load orders')
    } finally { setLoading(false) }
  }
  useEffect(() => { loadOrders() }, [])

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase()
    return orders.filter(order => {
      const matchesSearch = !term || order.order_number?.toLowerCase().includes(term) || order.shipping_name?.toLowerCase().includes(term) || order.shipping_phone?.toLowerCase().includes(term)
      return matchesSearch && (filter === 'ALL' || order.status === filter)
    })
  }, [orders, search, filter])
  const formatDate = value => !value ? '—' : new Date(value.replace(' ', 'T')).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const formatAmount = value => Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return <div className="orders-page">
    <div className="page-header"><div><span className="eyebrow">ORDER MANAGEMENT</span><h1>Orders</h1><p>Review and manage every ARAmane Arts order.</p></div><button type="button" className="gold-outline-button" onClick={loadOrders} disabled={loading}>{loading ? 'Refreshing...' : '↻ Refresh'}</button></div>
    <div className="gold-rule" />
    <div className="orders-toolbar"><div className="orders-search"><span>⌕</span><input type="text" placeholder="Search order number, customer or phone..." value={search} onChange={event => setSearch(event.target.value)} /></div><div className="orders-toolbar-note">{filteredOrders.length} visible</div></div>
    <div className="orders-filters"><button type="button" className={filter === 'ALL' ? 'active' : ''} onClick={() => setFilter('ALL')}>All <span>{orders.length}</span></button>{Object.entries(statusLabels).map(([value, label]) => <button type="button" key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label} <span>{orders.filter(order => order.status === value).length}</span></button>)}</div>
    {loading && <div className="orders-state"><span>✦</span><strong>Loading orders</strong><p>Gathering the latest order information.</p></div>}
    {!loading && error && <div className="orders-state orders-state-error"><span>!</span><strong>Unable to load orders</strong><p>{error}</p><button type="button" onClick={loadOrders}>Try again</button></div>}
    {!loading && !error && filteredOrders.length === 0 && <div className="orders-state"><span>◇</span><strong>{orders.length === 0 ? 'No orders have been placed yet' : 'No orders found'}</strong><p>{orders.length === 0 ? 'Customer orders will appear here once they are placed.' : 'Try changing your search or status filter.'}</p></div>}
    {!loading && !error && filteredOrders.length > 0 && <div className="orders-table-card heritage-card"><div className="orders-table-wrap"><table className="orders-table"><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>DATE</th><th>TOTAL</th><th>STATUS</th><th></th></tr></thead><tbody>{filteredOrders.map(order => <tr key={order.id} onClick={() => navigate(`/orders/${order.id}`)}><td><strong className="order-number">#{order.order_number}</strong><span className="order-open-hint">Open order →</span></td><td><div className="order-customer"><strong>{order.shipping_name || 'Customer'}</strong><span>{order.shipping_phone || '—'}</span>{order.shipping_city && <small>{order.shipping_city}{order.shipping_state ? `, ${order.shipping_state}` : ''}</small>}</div></td><td><span className="order-date">{formatDate(order.created_at)}</span></td><td><strong className="order-total">₹{formatAmount(order.total_amount)}</strong></td><td><span className={`order-status-badge ${statusClasses[order.status] || ''}`}>{statusLabels[order.status] || order.status}</span></td><td><button type="button" className="order-view-button" onClick={event => { event.stopPropagation(); navigate(`/orders/${order.id}`) }}>View</button></td></tr>)}</tbody></table></div><div className="orders-result-count">Showing {filteredOrders.length} of {orders.length} orders</div></div>}
  </div>
}
