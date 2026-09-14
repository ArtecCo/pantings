import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiUrl } from '../config/api'

export default function TrackOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadOrders() }, [])

  const loadOrders = async () => {
    try {
      setLoading(true); setError('')
      const response = await fetch(apiUrl('orders/my-orders.php'), { method: 'GET', credentials: 'include' })
      const data = await response.json().catch(() => ({}))
      if (response.status === 401) { setAuthenticated(false); return }
      if (!response.ok || !data.success) throw new Error(data.message || 'Unable to load your orders.')
      setAuthenticated(true); setOrders(data.orders || [])
    } catch (err) { setError(err.message || 'Unable to load your orders.') }
    finally { setLoading(false) }
  }

  if (loading) return <div className="ara-collection-state"><span className="ara-loader"></span><p>Loading your orders...</p></div>
  if (!authenticated && !error) return <div className="ara-collection-state" style={{ textAlign: 'center' }}><strong>Sign in to track your orders</strong><p>Your orders are securely linked to your account. Sign in to view order status, delivery details and tracking information.</p><Link to="/login" className="ara-btn ara-btn-primary">Sign In</Link></div>
  if (error) return <div className="ara-collection-state ara-error-state"><strong>Unable to load your orders</strong><p>{error}</p><button type="button" onClick={loadOrders}>Try Again</button></div>

  return <div className="max-w-4xl mx-auto p-6"><h1 className="text-3xl font-bold mb-8">Track Orders</h1>{orders.length === 0 ? <div className="ara-collection-state"><strong>No orders yet</strong><p>Once you place an order, its status and delivery details will appear here.</p><Link to="/paintings" className="ara-btn ara-btn-primary">Explore Paintings</Link></div> : <div className="space-y-6">{orders.map(order => <div key={order.id} className="border rounded-lg p-6 shadow-sm"><div className="flex justify-between items-start mb-4"><div><h3 className="text-xl font-semibold text-gray-800">Order #{order.order_number}</h3><p className="text-sm text-gray-500">Placed on {new Date(order.created_at).toLocaleDateString()}</p></div><span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>{order.status}</span></div><div className="grid grid-cols-2 gap-4 mt-6"><div><p className="text-sm font-medium text-gray-700">Total Amount</p><p className="text-lg font-bold">₹{Number(order.total_amount || 0).toLocaleString('en-IN')}</p></div><div><p className="text-sm font-medium text-gray-700">Shipping Details</p><p className="text-sm text-gray-600">{order.shipping_name}</p><p className="text-sm text-gray-600">{order.shipping_city}, {order.shipping_country}</p></div></div>{(order.tracking_courier || order.tracking_id) && <div className="mt-5 pt-5 border-t"><p className="text-sm font-medium text-gray-700">Tracking</p><p className="text-sm text-gray-600">{order.tracking_courier || 'Courier'}{order.tracking_id ? ` · ${order.tracking_id}` : ''}</p>{order.tracking_url && <a href={order.tracking_url} target="_blank" rel="noreferrer" className="text-sm underline">Track shipment</a>}</div>}</div>)}</div>}</div>
}

function getStatusColor(status) {
  switch (status) {
    case 'Order created': return 'bg-blue-100 text-blue-800'
    case 'Artist to get in touch': return 'bg-purple-100 text-purple-800'
    case 'Accepted': return 'bg-yellow-100 text-yellow-800'
    case 'Processing': return 'bg-orange-100 text-orange-800'
    case 'Dispatched': return 'bg-indigo-100 text-indigo-800'
    case 'Delivered': return 'bg-green-100 text-green-800'
    case 'REJECTED': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
