import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useToast } from '../components/Toast'

const STATUSES = [
  ['PENDING_ACCEPTANCE', 'Pending Acceptance'], ['ACCEPTED', 'Accepted'],
  ['PAYMENT_DUE', 'Payment Due'], ['PAID', 'Paid'], ['PROCESSING', 'Processing'],
  ['DISPATCHED', 'Dispatched'], ['DELIVERED', 'Delivered'], ['REJECTED', 'Rejected'], ['CANCELLED', 'Cancelled'],
]
const API = 'http://localhost/paintings/api'

export default function OrderStatusManager() {
  const { id } = useParams()
  const { toast } = useToast()
  const [order, setOrder] = useState(null)
  const [status, setStatus] = useState('PENDING_ACCEPTANCE')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`${API}/orders/get.php?id=${id}`, { credentials: 'include', cache: 'no-store' })
      .then(response => response.json())
      .then(data => {
        if (!data.success) throw new Error(data.message || 'Unable to load order')
        setOrder(data.order)
        setStatus(data.order.status || 'PENDING_ACCEPTANCE')
      })
      .catch(error => toast.error(error.message || 'Unable to load order status'))
  }, [id])

  const saveStatus = async () => {
    if (!order || saving) return
    setSaving(true)
    try {
      const response = await fetch(`${API}/orders/update-status.php`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ order_id: order.id, action: status, notes: notes.trim() }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.success) throw new Error(data.message || 'Unable to update order status')
      setOrder(previous => ({ ...previous, status: data.new_status }))
      setNotes('')
      toast.success('Order status updated')
    } catch (error) {
      toast.error(error.message || 'Unable to update order status')
    } finally { setSaving(false) }
  }

  if (!order) return null

  return (
    <section className="heritage-card order-status-manager">
      <div className="order-status-manager-copy">
        <span className="eyebrow">ORDER CONTROL</span>
        <h2>Update Order Status</h2>
        <p>Change the customer-facing status. The tracking page refreshes automatically.</p>
      </div>
      <div className="order-status-manager-controls">
        <label><span>STATUS</span><select value={status} onChange={event => setStatus(event.target.value)} disabled={saving}>
          {STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></label>
        <label><span>NOTE <small>(optional)</small></span><input value={notes} onChange={event => setNotes(event.target.value)} maxLength={2000} placeholder="Add an internal status note" disabled={saving} /></label>
        <button type="button" className="order-status-save" onClick={saveStatus} disabled={saving || (status === order.status && !notes.trim())}>
          {saving ? 'Saving…' : 'Save Status'}
        </button>
      </div>
    </section>
  )
}
