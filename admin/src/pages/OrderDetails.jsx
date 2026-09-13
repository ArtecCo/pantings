import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../components/Toast'

const API = 'http://localhost/paintings/api'

const statusLabels = {
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

const statusClasses = {
  PENDING_ACCEPTANCE: 'pending',
  ACCEPTED: 'accepted',
  PAYMENT_DUE: 'payment-due',
  PAID: 'paid',
  PROCESSING: 'processing',
  DISPATCHED: 'dispatched',
  DELIVERED: 'delivered',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
}

export default function OrderDetails() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { toast } = useToast()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
const [actionPrompt, setActionPrompt] = useState(null)
const [actionNotes, setActionNotes] = useState('')
const [actionLoading, setActionLoading] = useState(false)
const [history, setHistory] = useState([])

  useEffect(() => {
    loadOrder()
  }, [id])

  const loadOrder = async () => {
    setLoading(true)

    try {
      const response = await fetch(
        `${API}/orders/get.php?id=${id}`,
        {
          credentials: 'include',
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Unable to load order'
        )
      }

      setOrder(data.order)

      const historyResponse = await fetch(
  `${API}/orders/history.php?order_id=${id}`,
  {
    credentials: 'include',
  }
)

const historyData = await historyResponse.json()

if (historyResponse.ok && historyData.success) {
  setHistory(historyData.history || [])
}

    } catch (error) {
      console.error('Order loading error:', error)

      toast.error(
        error.message || 'Unable to load order'
      )

    } finally {
      setLoading(false)
    }
  }

  const handleOrderAction = async () => {
  if (!actionPrompt || actionLoading) return

  setActionLoading(true)

  try {
    const response = await fetch(`${API}/orders/update-status.php`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        order_id: order.id,
        action: actionPrompt,
        notes: actionNotes.trim(),
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || 'Unable to update order'
      )
    }

    setOrder(previous => ({
      ...previous,
      status: data.new_status,
      artist_notes: actionNotes.trim() || previous.artist_notes,
      accepted_at:
        data.new_status === 'ACCEPTED'
          ? new Date().toISOString()
          : previous.accepted_at,
    }))

    toast.success(data.message)

    setActionPrompt(null)
    setActionNotes('')

  } catch (error) {
    console.error('Order status update error:', error)

    toast.error(
      error.message || 'Unable to update order'
    )
  } finally {
    setActionLoading(false)
  }
}

  const formatDate = value => {
    if (!value) return '—'

    return new Date(
      value.replace(' ', 'T')
    ).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatAmount = value =>
    Number(value || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  if (loading) {
    return (
      <div className="order-details-page">

        <div className="page-header">
          <div>
            <span className="eyebrow">
              ORDER MANAGEMENT
            </span>

            <h1>Order Details</h1>

            <p>Loading order information...</p>
          </div>
        </div>

        <div className="gold-rule" />

        <div className="heritage-card metadata-loading">
          Loading order...
        </div>

      </div>
    )
  }

  if (!order) {
    return (
      <div className="order-details-page">

        <div className="page-header">
          <div>
            <span className="eyebrow">
              ORDER MANAGEMENT
            </span>

            <h1>Order Not Found</h1>

            <p>
              This order could not be loaded.
            </p>
          </div>

          <button
            type="button"
            className="back-button"
            onClick={() => navigate('/orders')}
          >
            ← Back to Orders
          </button>
        </div>

      </div>
    )
  }

  return (
    <div className="order-details-page">

      {/* HEADER */}

      <div className="page-header">

        <div>

          <span className="eyebrow">
            ORDER MANAGEMENT
          </span>

          <h1>
            Order #{order.order_number}
          </h1>

          <p>
            Placed on {formatDate(order.created_at)}
          </p>

        </div>

        <button
          type="button"
          className="back-button"
          onClick={() => navigate('/orders')}
        >
          ← Back to Orders
        </button>

      </div>

      <div className="gold-rule" />

      {/* ORDER SUMMARY */}

      <section className="heritage-card order-summary-card">

        <div>

          <span className="eyebrow">
            CURRENT STATUS
          </span>

          <div className="order-detail-status-row">

            <span
              className={`order-status-badge ${
                statusClasses[order.status] || ''
              }`}
            >
              {statusLabels[order.status] || order.status}
            </span>

          </div>

        </div>

        <div className="order-summary-total">

          <span>TOTAL</span>

          <strong>
            ₹{formatAmount(order.total_amount)}
          </strong>

        </div>

        {order.status === 'PENDING_ACCEPTANCE' && (
  <div className="order-action-buttons">

    <button
      type="button"
      className="order-reject-button"
      onClick={() => {
        setActionPrompt('REJECT')
        setActionNotes('')
      }}
    >
      Reject Order
    </button>

    <button
      type="button"
      className="order-accept-button"
      onClick={() => {
        setActionPrompt('ACCEPT')
        setActionNotes('')
      }}
    >
      Accept Order
    </button>

  </div>
)}

      </section>

      {/* CUSTOMER + SHIPPING */}

      <div className="order-detail-grid">

        <section className="heritage-card">

          <div className="form-section-heading">

            <span className="eyebrow">
              01 · CUSTOMER
            </span>

            <h2>Customer Information</h2>

          </div>

          <div className="order-info-list">

            <div>
              <span>NAME</span>
              <strong>
                {order.shipping_name || '—'}
              </strong>
            </div>

            <div>
              <span>PHONE</span>
              <strong>
                {order.shipping_phone || '—'}
              </strong>
            </div>

            <div>
              <span>CUSTOMER ID</span>
              <strong>
                {order.user_id || '—'}
              </strong>
            </div>

          </div>

        </section>

        <section className="heritage-card">

          <div className="form-section-heading">

            <span className="eyebrow">
              02 · DELIVERY
            </span>

            <h2>Shipping Address</h2>

          </div>

          <div className="order-address">

            <strong>
              {order.shipping_name || '—'}
            </strong>

            <span>
              {order.shipping_address_line_1 || ''}
            </span>

            {order.shipping_address_line_2 && (
              <span>
                {order.shipping_address_line_2}
              </span>
            )}

            <span>
              {order.shipping_city || ''}
              {order.shipping_state
                ? `, ${order.shipping_state}`
                : ''}
            </span>

            <span>
              {order.shipping_postal_code || ''}
            </span>

            <span>
              {order.shipping_country || ''}
            </span>

          </div>

        </section>

      </div>

      {/* ORDER ITEMS */}

      <section className="heritage-card order-items-card">

        <div className="form-section-heading">

          <span className="eyebrow">
            03 · ARTWORK
          </span>

          <h2>Ordered Paintings</h2>

          <p>
            {order.items?.length || 0} item
            {order.items?.length === 1 ? '' : 's'} in this order.
          </p>

        </div>

        <div className="order-items">

          {(order.items || []).map(item => (

            <div
              className="order-item"
              key={item.id}
            >

              <div className="order-item-art">

                <div className="order-item-symbol">
                  ✦
                </div>

                <div>

                  <strong>
                    {item.painting_name}
                  </strong>

                  <span>
                    {item.artist_name || 'ARAmane Arts'}
                  </span>

                </div>

              </div>

              <div className="order-item-quantity">
                <span>QTY</span>
                <strong>{item.quantity}</strong>
              </div>

              <div className="order-item-price">
                <span>
                  ₹{formatAmount(item.unit_price)}
                </span>

                <strong>
                  ₹{formatAmount(item.total_price)}
                </strong>
              </div>

            </div>

          ))}

        </div>

      </section>

      {/* AMOUNT BREAKDOWN */}

      <section className="heritage-card order-financial-card">

        <div className="form-section-heading">

          <span className="eyebrow">
            04 · ORDER VALUE
          </span>

          <h2>Amount Summary</h2>

        </div>

        <div className="order-financial-list">

          <div>
            <span>Subtotal</span>
            <strong>
              ₹{formatAmount(order.subtotal)}
            </strong>
          </div>

          <div>
            <span>Shipping</span>
            <strong>
              ₹{formatAmount(order.shipping_amount)}
            </strong>
          </div>

          <div>
            <span>Discount</span>
            <strong>
              − ₹{formatAmount(order.discount_amount)}
            </strong>
          </div>

          <div className="order-financial-total">
            <span>Total</span>
            <strong>
              ₹{formatAmount(order.total_amount)}
            </strong>
          </div>

        </div>

      </section>

      {/* NOTES */}

      {(order.customer_notes || order.artist_notes) && (

        <section className="order-detail-grid">

          {order.customer_notes && (
            <div className="heritage-card">

              <div className="form-section-heading">
                <span className="eyebrow">
                  05 · CUSTOMER NOTE
                </span>

                <h2>Customer Requirements</h2>
              </div>

              <p className="order-note">
                {order.customer_notes}
              </p>

            </div>
          )}

          {order.artist_notes && (
            <div className="heritage-card">

              <div className="form-section-heading">
                <span className="eyebrow">
                  06 · ARTIST NOTE
                </span>

                <h2>Artist Notes</h2>
              </div>

              <p className="order-note">
                {order.artist_notes}
              </p>

            </div>
          )}

        </section>

      )}

      {/* TRACKING */}

      {(order.tracking_courier ||
        order.tracking_id ||
        order.tracking_url) && (

        <section className="heritage-card">

          <div className="form-section-heading">

            <span className="eyebrow">
              DELIVERY
            </span>

            <h2>Tracking Information</h2>

          </div>

          <div className="order-info-list">

            <div>
              <span>COURIER</span>
              <strong>
                {order.tracking_courier || '—'}
              </strong>
            </div>

            <div>
              <span>TRACKING ID</span>
              <strong>
                {order.tracking_id || '—'}
              </strong>
            </div>

            {order.tracking_url && (
              <div>
                <span>TRACKING</span>
                <a
                  href={order.tracking_url}
                  target="_blank"
                  rel="noreferrer"
                  className="order-tracking-link"
                >
                  Open Tracking →
                </a>
              </div>
            )}

          </div>

        </section>

      )}

      {/* IMPORTANT DATES */}

      <section className="heritage-card">

        <div className="form-section-heading">

          <span className="eyebrow">
            ORDER TIMELINE
          </span>

          <h2>Important Dates</h2>

        </div>

        <div className="order-timeline-grid">

          <div>
            <span>ORDERED</span>
            <strong>{formatDate(order.created_at)}</strong>
          </div>

          <div>
            <span>ACCEPTED</span>
            <strong>{formatDate(order.accepted_at)}</strong>
          </div>

          <div>
            <span>PAID</span>
            <strong>{formatDate(order.paid_at)}</strong>
          </div>

          <div>
            <span>DISPATCHED</span>
            <strong>{formatDate(order.dispatched_at)}</strong>
          </div>

          <div>
            <span>DELIVERED</span>
            <strong>{formatDate(order.delivered_at)}</strong>
          </div>

        </div>

      </section>

      <section className="heritage-card order-history-card">

  <div className="form-section-heading">

    <span className="eyebrow">
      STATUS HISTORY
    </span>

    <h2>Order Journey</h2>

    <p>
      A record of every status change for this order.
    </p>

  </div>

  {history.length === 0 ? (

    <div className="order-history-empty">
      No status history has been recorded yet.
    </div>

  ) : (

    <div className="order-history">

      {history.map((entry, index) => (

        <div
          className="order-history-item"
          key={entry.id}
        >

          <div className="order-history-marker">

            <span>
              {index === history.length - 1 ? '✦' : '◇'}
            </span>

            {index < history.length - 1 && (
              <div className="order-history-line" />
            )}

          </div>

          <div className="order-history-content">

            <div className="order-history-header">

              <div>

                <span
                  className={`order-status-badge ${
                    statusClasses[entry.new_status] || ''
                  }`}
                >
                  {statusLabels[entry.new_status] ||
                    entry.new_status}
                </span>

              </div>

              <span className="order-history-date">
                {formatDate(entry.created_at)}
              </span>

            </div>

            <div className="order-history-transition">

              {entry.old_status && (
                <>
                  <span>
                    {statusLabels[entry.old_status] ||
                      entry.old_status}
                  </span>

                  <strong>→</strong>
                </>
              )}

              <strong>
                {statusLabels[entry.new_status] ||
                  entry.new_status}
              </strong>

            </div>

            <div className="order-history-meta">

              <span>
                Changed by:{' '}
                {entry.changed_by_type || 'SYSTEM'}
              </span>

              {entry.changed_by && (
                <span>
                  User ID: {entry.changed_by}
                </span>
              )}

            </div>

            {entry.notes && (
              <div className="order-history-note">
                {entry.notes}
              </div>
            )}

          </div>

        </div>

      ))}

    </div>

  )}

</section>


{actionPrompt && (
  <div className="ara-confirm-overlay">

    <div className="ara-confirm-card order-action-modal">

      <div className="ara-confirm-symbol">
        {actionPrompt === 'ACCEPT' ? '✦' : '◇'}
      </div>

      <span className="eyebrow">
        ORDER #{order.order_number}
      </span>

      <h2>
        {actionPrompt === 'ACCEPT'
          ? 'Accept this order?'
          : 'Reject this order?'}
      </h2>

      <p>
        {actionPrompt === 'ACCEPT'
          ? 'The order will move forward and the customer will be able to receive the payment request.'
          : 'The order will be marked as rejected and will no longer remain pending acceptance.'}
      </p>

      <div className="order-action-note">

        <label htmlFor="artist-action-notes">
          {actionPrompt === 'ACCEPT'
            ? 'ARTIST NOTE (OPTIONAL)'
            : 'REASON / ARTIST NOTE (OPTIONAL)'}
        </label>

        <textarea
          id="artist-action-notes"
          value={actionNotes}
          onChange={event =>
            setActionNotes(event.target.value)
          }
          placeholder={
            actionPrompt === 'ACCEPT'
              ? 'Add any note about the order...'
              : 'Add a reason for rejecting the order...'
          }
          rows={4}
          disabled={actionLoading}
        />

      </div>

      <div className="ara-confirm-actions">

        <button
          type="button"
          className="ara-confirm-cancel"
          onClick={() => {
            setActionPrompt(null)
            setActionNotes('')
          }}
          disabled={actionLoading}
        >
          Cancel
        </button>

        <button
          type="button"
          className={
            actionPrompt === 'ACCEPT'
              ? 'ara-confirm-primary'
              : 'order-reject-confirm'
          }
          onClick={handleOrderAction}
          disabled={actionLoading}
        >
          {actionLoading
            ? 'Updating...'
            : actionPrompt === 'ACCEPT'
              ? 'Accept Order'
              : 'Reject Order'}
        </button>

      </div>

    </div>

  </div>
)}
    </div>
  )
}