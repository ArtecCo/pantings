import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useToast } from '../components/Toast'

const STATUSES = [
  ['PENDING_ACCEPTANCE', 'Pending Acceptance'], ['ACCEPTED', 'Accepted'], ['PAYMENT_DUE', 'Payment Due'],
  ['PAID', 'Paid'], ['PROCESSING', 'Processing'], ['DISPATCHED', 'Dispatched'], ['DELIVERED', 'Delivered'],
  ['REJECTED', 'Rejected'], ['CANCELLED', 'Cancelled'],
]
const API = 'http://localhost/paintings/api'
const money = value => Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function OrderStatusManager() {
  const { id } = useParams(); const { toast } = useToast()
  const [order, setOrder] = useState(null); const [status, setStatus] = useState('PENDING_ACCEPTANCE'); const [notes, setNotes] = useState(''); const [saving, setSaving] = useState(false)
  const [pricing, setPricing] = useState({ base_amount: '', customization_amount: '0', delivery_amount: '0', discount_amount: '0', payment_link: '' }); const [releasing, setReleasing] = useState(false)

  const loadOrder = async () => {
    try { const response = await fetch(`${API}/orders/get.php?id=${id}`, { credentials: 'include', cache: 'no-store' }); const data = await response.json(); if (!data.success) throw new Error(data.message || 'Unable to load order'); const next = data.order; setOrder(next); setStatus(next.status || 'PENDING_ACCEPTANCE'); setPricing({ base_amount: next.base_amount ?? next.subtotal ?? '', customization_amount: next.customization_amount ?? '0', delivery_amount: next.delivery_amount ?? next.shipping_amount ?? '0', discount_amount: next.discount_amount ?? '0', payment_link: next.payment_link ?? '' }) }
    catch (error) { toast.error(error.message || 'Unable to load order') }
  }
  useEffect(() => { loadOrder() }, [id])

  const saveStatus = async () => {
    if (!order || saving) return; setSaving(true)
    try { const response = await fetch(`${API}/orders/update-status.php`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json',Accept:'application/json'}, body:JSON.stringify({ order_id:order.id, action:status, notes:notes.trim() }) }); const data=await response.json().catch(()=>({})); if(!response.ok||!data.success) throw new Error(data.message||'Unable to update order status'); setOrder(previous=>({...previous,status:data.new_status})); setNotes(''); toast.success('Order status updated') }
    catch(error){ toast.error(error.message||'Unable to update order status') } finally{ setSaving(false) }
  }

  const releasePrice = async () => {
    if (!order || releasing) return
    const payload = { order_id: order.id, ...Object.fromEntries(Object.entries(pricing).map(([key,value]) => [key, key === 'payment_link' ? value : Number(value || 0)])), notes: notes.trim() }
    setReleasing(true)
    try { const response=await fetch(`${API}/orders/release-price.php`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)}); const data=await response.json().catch(()=>({})); if(!response.ok||!data.success) throw new Error(data.message||'Unable to release final price'); setOrder(previous=>({...previous,status:'PAYMENT_DUE',...data})); setStatus('PAYMENT_DUE'); setNotes(''); toast.success('Final price released. The customer can now view the quotation.') }
    catch(error){ toast.error(error.message||'Unable to release final price') } finally{ setReleasing(false) }
  }

  if (!order) return null
  const canRelease = order.status === 'ACCEPTED' || order.status === 'PAYMENT_DUE'
  const finalAmount = Number(pricing.base_amount||0)+Number(pricing.customization_amount||0)+Number(pricing.delivery_amount||0)-Number(pricing.discount_amount||0)

  return <>
    <section className="heritage-card order-status-manager">
      <div className="order-status-manager-copy"><span className="eyebrow">ORDER CONTROL</span><h2>Update Order Status</h2><p>Change the customer-facing status. The tracking page refreshes automatically.</p></div>
      <div className="order-status-manager-controls"><label><span>STATUS</span><select value={status} onChange={event=>setStatus(event.target.value)} disabled={saving}>{STATUSES.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label><span>NOTE <small>(optional)</small></span><input value={notes} onChange={event=>setNotes(event.target.value)} maxLength={2000} placeholder="Add an internal status note" disabled={saving}/></label><button type="button" className="order-status-save" onClick={saveStatus} disabled={saving||(status===order.status&&!notes.trim())}>{saving?'Saving…':'Save Status'}</button></div>
    </section>
    {canRelease && <section className="heritage-card order-price-release-card">
      <div className="form-section-heading"><span className="eyebrow">FINAL QUOTATION</span><h2>Release Price to Customer</h2><p>The customer will see this breakdown after you release it. The payment link is optional and can be added manually.</p></div>
      <div className="order-price-grid">
        <label><span>BASE PRICE</span><input type="number" min="0" step="0.01" value={pricing.base_amount} onChange={e=>setPricing({...pricing,base_amount:e.target.value})}/></label>
        <label><span>CUSTOMIZATION FEE</span><input type="number" min="0" step="0.01" value={pricing.customization_amount} onChange={e=>setPricing({...pricing,customization_amount:e.target.value})}/></label>
        <label><span>DELIVERY FEE</span><input type="number" min="0" step="0.01" value={pricing.delivery_amount} onChange={e=>setPricing({...pricing,delivery_amount:e.target.value})}/></label>
        <label><span>DISCOUNT</span><input type="number" min="0" step="0.01" value={pricing.discount_amount} onChange={e=>setPricing({...pricing,discount_amount:e.target.value})}/></label>
        <label className="order-price-link-field"><span>PAYMENT LINK <small>(optional)</small></span><input type="url" value={pricing.payment_link} onChange={e=>setPricing({...pricing,payment_link:e.target.value})} placeholder="https://…"/></label>
      </div>
      <div className="order-price-release-total"><span>FINAL AMOUNT</span><strong>₹{money(finalAmount)}</strong></div>
      <button type="button" className="order-price-release-button" onClick={releasePrice} disabled={releasing || finalAmount < 0}>{releasing?'Releasing…':order.status==='PAYMENT_DUE'?'Update Released Price':'Release Price & Request Payment'}</button>
    </section>}
  </>
}
