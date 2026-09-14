import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiUrl } from '../config/api'

const STATUS_LABELS = {
  PENDING_ACCEPTANCE: 'Pending Acceptance',
  ACCEPTED: 'Accepted',
  PAYMENT_DUE: 'Payment Due',
  PAID: 'Paid',
  PROCESSING: 'Processing',
  DISPATCHED: 'Dispatched',
  DELIVERED: 'Delivered',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
}

const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `http://localhost${url}`
}

export default function TrackOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadOrders(true)
    const interval = setInterval(() => loadOrders(false), 15000)
    return () => clearInterval(interval)
  }, [])

  const loadOrders = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true)
      setError('')
      const response = await fetch(apiUrl('orders/my-orders.php'), {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })
      const data = await response.json().catch(() => ({}))

      if (response.status === 401) {
        setAuthenticated(false)
        return
      }
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to load your orders.')
      }

      setAuthenticated(true)
      setOrders(data.orders || [])
    } catch (err) {
      if (showLoading) setError(err.message || 'Unable to load your orders.')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="ara-collection-state">
        <span className="ara-loader"></span>
        <p>Loading your orders...</p>
      </div>
    )
  }

  if (!authenticated && !error) {
    return (
      <div className="ara-collection-state" style={{ textAlign: 'center' }}>
        <strong>Sign in to track your orders</strong>
        <p>Your orders are securely linked to your account. Sign in to view order status, delivery details and tracking information.</p>
        <Link to="/login" className="ara-btn ara-btn-primary">Sign In</Link>
      </div>
    )
  }

  if (error) {
    return (
      <div className="ara-collection-state ara-error-state">
        <strong>Unable to load your orders</strong>
        <p>{error}</p>
        <button type="button" onClick={() => loadOrders(true)}>Try Again</button>
      </div>
    )
  }

  return (
    <section className="ara-orders">
      <div className="ara-orders-heading">
        <div>
          <span className="ara-orders-eyebrow">YOUR JOURNEY</span>
          <h2>Track Orders</h2>
        </div>
        <span className="ara-orders-count">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'}
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="ara-collection-state">
          <strong>No orders yet</strong>
          <p>Once you place an order, its status and delivery details will appear here.</p>
          <Link to="/paintings" className="ara-btn ara-btn-primary">Explore Paintings</Link>
        </div>
      ) : (
        <div className="ara-order-list">
          {orders.map(order => {
            const items = Array.isArray(order.items) ? order.items : []
            const preview = items.find(item => item.image_url)?.image_url || ''
            const firstItem = items[0]
            const itemCount = items.reduce((total, item) => total + Number(item.quantity || 0), 0)
            const statusLabel = STATUS_LABELS[order.status] || order.status || 'Unknown'

            return (
              <article className="ara-order-banner" key={order.id}>
                <div className="ara-order-art">
                  {preview ? (
                    <img src={getImageUrl(preview)} alt={firstItem?.painting_name || 'Ordered painting'} />
                  ) : (
                    <div className="ara-order-art-placeholder">
                      <span>ARAMANE ARTS</span>
                      <strong>Heritage</strong>
                    </div>
                  )}
                </div>

                <div className="ara-order-main">
                  <div className="ara-order-topline">
                    <div>
                      <span className="ara-order-label">ORDER</span>
                      <h3>#{order.order_number}</h3>
                    </div>
                    <span className={`ara-order-status ara-status-${getStatusKey(order.status)}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="ara-order-content">
                    <div className="ara-order-painting">
                      <span className="ara-order-category">YOUR COLLECTION</span>
                      <strong>{firstItem?.painting_name || 'Painting order'}</strong>
                      {items.length > 1 && (
                        <span className="ara-order-more">+ {items.length - 1} more {items.length === 2 ? 'painting' : 'paintings'}</span>
                      )}
                    </div>

                    <div className="ara-order-meta">
                      <div>
                        <span>PLACED</span>
                        <strong>{new Date(order.created_at).toLocaleDateString()}</strong>
                      </div>
                      <div>
                        <span>ITEMS</span>
                        <strong>{itemCount || items.length || 1}</strong>
                      </div>
                      <div>
                        <span>TOTAL</span>
                        <strong>₹{Number(order.total_amount || 0).toLocaleString('en-IN')}</strong>
                      </div>
                    </div>
                  </div>

                  {(order.tracking_courier || order.tracking_id || order.tracking_url) && (
                    <div className="ara-order-tracking">
                      <span className="ara-tracking-dot" />
                      <div>
                        <span>SHIPMENT</span>
                        <strong>
                          {order.tracking_courier || 'Courier'}
                          {order.tracking_id ? ` · ${order.tracking_id}` : ''}
                        </strong>
                      </div>
                      {order.tracking_url && (
                        <a href={order.tracking_url} target="_blank" rel="noreferrer">
                          Track shipment <span>→</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="ara-order-arrow" aria-hidden="true">→</div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function getStatusKey(status) {
  return String(status || 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
