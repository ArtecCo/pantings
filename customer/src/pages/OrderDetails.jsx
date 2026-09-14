import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiUrl } from '../config/api'
import './OrderDetails.css'

const STATUS_LABELS={PENDING_ACCEPTANCE:'Pending Acceptance',ACCEPTED:'Accepted',PAYMENT_DUE:'Payment Due',PAID:'Paid',PROCESSING:'Processing',DISPATCHED:'Dispatched',DELIVERED:'Delivered',REJECTED:'Rejected',CANCELLED:'Cancelled'}
const getImageUrl=url=>!url?'':url.startsWith('http')?url:`http://localhost${url}`
const money=value=>Number(value||0).toLocaleString('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2})
const formatDate=value=>value?new Date(String(value).replace(' ','T')).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—'

export default function OrderDetails(){
 const {id}=useParams();const navigate=useNavigate();const [order,setOrder]=useState(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('')
 useEffect(()=>{loadOrder()},[id])
 const loadOrder=async()=>{try{setLoading(true);setError('');const response=await fetch(apiUrl('orders/my-orders.php'),{credentials:'include',cache:'no-store'});const data=await response.json().catch(()=>({}));if(response.status===401){navigate('/login',{replace:true});return}if(!response.ok||!data.success)throw new Error(data.message||'Unable to load your orders.');const found=(data.orders||[]).find(item=>String(item.id)===String(id));if(!found)throw new Error('We could not find this order.');setOrder(found)}catch(err){setError(err.message||'Unable to load this order.')}finally{setLoading(false)}}
 if(loading)return <main className="ara-order-details"><div className="ara-order-page-state"><span className="ara-loader"/><p>Loading your order...</p></div></main>
 if(error||!order)return <main className="ara-order-details"><div className="ara-order-page-state"><span>◇</span><h1>Order unavailable</h1><p>{error||'We could not find this order.'}</p><button className="ara-btn ara-btn-primary" onClick={()=>navigate('/track-orders')}>Back to Orders</button></div></main>
 const items=Array.isArray(order.items)?order.items:[];const released=Boolean(order.price_released_at);const status=STATUS_LABELS[order.status]||order.status||'Unknown';const first=items[0]
 const journey=[
  ['ORDERED','Order placed',order.created_at],
  ['ACCEPTED','Order accepted',order.accepted_at],
  ['PAYMENT_DUE','Payment due',order.status==='PAYMENT_DUE'?order.price_released_at:null],
  ['PAID','Payment received',order.paid_at],
  ['PROCESSING','Artwork preparation',order.status==='PROCESSING'?order.updated_at:null],
  ['DISPATCHED','Artwork dispatched',order.dispatched_at],
  ['DELIVERED','Artwork delivered',order.delivered_at],
 ].filter(([, ,date])=>date)
 if(['REJECTED','CANCELLED'].includes(order.status)) journey.push([order.status,STATUS_LABELS[order.status],order.updated_at])
 const isPaymentDue=order.status==='PAYMENT_DUE'
 const isPaid=order.status==='PAID'||Boolean(order.paid_at)
 return <main className="ara-order-details">
  <div className="ara-order-page-header"><div><Link to="/track-orders" className="ara-order-back">← Back to your orders</Link><span className="ara-orders-eyebrow">ORDER DETAILS</span><h1>#{order.order_number}</h1><p>Placed {formatDate(order.created_at)}</p></div>{first?.image_url&&<div className="ara-order-page-hero"><img src={getImageUrl(first.image_url)} alt={first.painting_name||'Ordered painting'}/></div>}</div>
  <div className="ara-order-page-grid">
   <section className="ara-order-page-card"><span className="ara-orders-eyebrow">01 · ARTWORK</span><h2>Your artwork</h2>{items.map(item=><div className="ara-order-page-item" key={item.id}>{item.image_url?<img src={getImageUrl(item.image_url)} alt=""/>:<div className="ara-order-page-item-placeholder">✦</div>}<div><strong>{item.painting_name}</strong><span>Quantity {item.quantity}</span></div><strong>{money(item.total_price)}</strong></div>)}</section>
   <section className="ara-order-page-card"><span className="ara-orders-eyebrow">02 · ORDER STATUS</span><h2>Where your order stands</h2><div className="ara-order-status-panel"><strong>{status}</strong><p>{order.status==='PENDING_ACCEPTANCE'?'Your order is with the artist for acceptance.':order.status==='ACCEPTED'?'Your order has been accepted. The final quotation will follow.':order.status==='PAYMENT_DUE'?'Your final quotation is ready and payment is due.':order.status==='PAID'?'Payment received. Your artwork is now moving through preparation.':order.status==='PROCESSING'?'Your artwork is being prepared.':order.status==='DISPATCHED'?'Your artwork has been dispatched.':order.status==='DELIVERED'?'Your artwork has been delivered.':'Your order status has been updated.'}</p>{isPaymentDue&&order.payment_link&&<a className="ara-btn ara-btn-primary ara-payment-link" href={order.payment_link} target="_blank" rel="noreferrer">Make Payment →</a>}</div></section>
   <section className="ara-order-page-card ara-order-page-price"><div className="ara-order-card-heading-row"><div><span className="ara-orders-eyebrow">03 · {released?'FINAL QUOTATION':'ORDER VALUE'}</span><h2>{released?'Your released quote':'Base price'}</h2></div>{released&&isPaid&&<button type="button" className="ara-invoice-button" disabled title="Invoice download will be available with the invoice module">Invoice</button>}</div>{released?<div className="ara-order-financial"><div><span>Base price</span><strong>{money(order.base_amount)}</strong></div><div><span>Customization fee</span><strong>{money(order.customization_amount)}</strong></div><div><span>Delivery fee</span><strong>{money(order.delivery_amount??order.shipping_amount)}</strong></div><div><span>Discount</span><strong>− {money(order.discount_amount)}</strong></div><div className="total"><span>Final amount</span><strong>{money(order.total_amount)}</strong></div></div>:<div className="ara-order-pending-price"><strong>{money(order.base_amount??order.subtotal)}</strong><p>The final quotation will be released after your order is accepted by the artist.</p></div>}</section>
   <section className="ara-order-page-card ara-order-journey-card"><span className="ara-orders-eyebrow">04 · ORDER JOURNEY</span><h2>Your journey</h2><div className="ara-order-journey-scroll"><div className="ara-order-journey">{journey.slice().reverse().map(([key,label,date],index)=><div className={`ara-journey-step ${index===0?'current':''}`} key={`${key}-${date}`}><span className="ara-journey-dot"/><div><span className="ara-journey-label">{label}</span><strong>{formatDate(date)}</strong></div></div>)}</div></div></section>
   {(order.customer_notes||order.tracking_courier||order.tracking_id)&&<section className="ara-order-page-card"><span className="ara-orders-eyebrow">05 · DETAILS</span><h2>Order details</h2>{order.customer_notes&&<div className="ara-order-note"><span>YOUR NOTE</span><p>{order.customer_notes}</p></div>}{(order.tracking_courier||order.tracking_id)&&<div className="ara-order-shipment"><span>SHIPMENT</span><strong>{order.tracking_courier||'Courier'}{order.tracking_id?` · ${order.tracking_id}`:''}</strong>{order.tracking_url&&<a href={order.tracking_url} target="_blank" rel="noreferrer">Track shipment →</a>}</div>}</section>}
  </div>
 </main>
}
