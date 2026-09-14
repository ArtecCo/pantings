import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiUrl } from '../config/api'

export default function Cart(){
 const navigate=useNavigate();const [items,setItems]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [formData,setFormData]=useState({shipping_name:'',shipping_phone:'',shipping_email:'',shipping_address:'',shipping_city:'',shipping_state:'',shipping_postal_code:'',shipping_country:''});const [checkoutLoading,setCheckoutLoading]=useState(false);const [updatingId,setUpdatingId]=useState(0)
 const loadCart=async()=>{try{setLoading(true);setError('');const r=await fetch(apiUrl('cart/get.php'),{credentials:'include'});const d=await r.json().catch(()=>({}));if(r.status===401){navigate('/login');return}if(!r.ok||!d.success)throw new Error(d.message||'Unable to load your cart.');setItems(d.items||[])}catch(e){setError(e.message||'Unable to load your cart.')}finally{setLoading(false)}}
 useEffect(()=>{loadCart()},[])
 const getImageUrl=url=>!url?'':url.startsWith('http')?url:`http://localhost${url}`
 const getOptions=item=>Array.isArray(item.size_options)?item.size_options:[]
 const selectedOption=item=>getOptions(item).find(o=>Number(o.id)===Number(item.size_option_id))||getOptions(item).find(o=>Number(o.is_standard)===1)||getOptions(item)[0]
 const price=item=>Number(selectedOption(item)?.price||item.discount_price||item.price||0)
 const subtotal=items.reduce((sum,item)=>sum+price(item)*Number(item.quantity||0),0)
 const change=e=>setFormData({...formData,[e.target.name]:e.target.value})
 const updateQuantity=async(item,quantity)=>{const next=Number(quantity);if(!Number.isInteger(next)||next<1)return;setUpdatingId(item.cart_item_id);setError('');try{const r=await fetch(apiUrl('cart/update-item.php'),{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({cart_item_id:item.cart_item_id,quantity:next})});const d=await r.json().catch(()=>({}));if(r.status===401){navigate('/login');return}if(!r.ok||!d.success)throw new Error(d.message||'Unable to update your cart.');await loadCart()}catch(e){setError(e.message||'Unable to update your cart.')}finally{setUpdatingId(0)}}
 const removeItem=async item=>{setUpdatingId(item.cart_item_id);setError('');try{const r=await fetch(apiUrl('cart/remove-item.php'),{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({cart_item_id:item.cart_item_id})});const d=await r.json().catch(()=>({}));if(r.status===401){navigate('/login');return}if(!r.ok||!d.success)throw new Error(d.message||'Unable to remove the item.');await loadCart()}catch(e){setError(e.message||'Unable to remove the item.')}finally{setUpdatingId(0)}}
 const checkout=async e=>{e.preventDefault();setCheckoutLoading(true);setError('');try{const r=await fetch(apiUrl('orders/create.php'),{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(formData)});const d=await r.json().catch(()=>({}));if(r.status===401){navigate('/login');return}if(!r.ok||!d.success)throw new Error(d.message||'Order submission failed.');navigate('/track-orders')}catch(e){setError(e.message||'Order submission failed.')}finally{setCheckoutLoading(false)}}
 if(loading)return <div className="ara-collection-state"><span className="ara-loader"></span><p>Loading your order...</p></div>
 if(error&&!items.length)return <div className="ara-collection-state ara-error-state"><strong>Unable to load your order</strong><p>{error}</p><button type="button" onClick={loadCart}>Try Again</button></div>
 return <main className="ara-cart-page">
  <header className="ara-cart-header"><div className="ara-cart-kicker"><span></span>YOUR ORDER<span></span></div><h1>Complete Your Order</h1><p>Select the size for each artwork, then share your details with us.</p></header>
  {error&&<div className="ara-error-message">{error}</div>}
  {!items.length?<div className="ara-cart-empty"><h2>Your order is empty</h2><p>Explore our collection and add a painting to begin your order.</p><Link to="/paintings" className="ara-btn ara-btn-primary">Explore Paintings</Link></div>:<div className="ara-order-layout">
   <section className="ara-cart-items" aria-label="Paintings in your order">{items.map(item=>{const options=getOptions(item);const option=selectedOption(item);return <article className="ara-cart-item" key={item.cart_item_id}>
    <div className="ara-cart-item-image">{item.image_url&&<img src={getImageUrl(item.image_url)} alt={item.name}/>}</div>
    <div><p className="ara-cart-item-category">{item.category_name||'Heritage Art'}</p><h2>{item.name}</h2>
     <div className="ara-cart-item-size"><label htmlFor={`size-${item.cart_item_id}`}>Size</label><select id={`size-${item.cart_item_id}`} value={option?.id||''} disabled={!options.length} onChange={()=>{}}>{options.length?options.map(o=><option key={o.id} value={o.id}>{o.name||`${o.width} × ${o.height} ${o.unit||'in'}`} · {formatPrice(o.price)}</option>):<option>{item.width&&item.height?`${item.width} × ${item.height} in`: 'Standard size'}</option>}</select></div>
     {option&&<p className="ara-cart-item-meta">{option.width} × {option.height} {option.unit||'in'} · {Number(option.is_standard)===1?'Standard size':''}</p>}
     <div className="ara-cart-item-actions"><div className="ara-qty"><button type="button" onClick={()=>updateQuantity(item,Number(item.quantity)-1)} disabled={updatingId===item.cart_item_id||Number(item.quantity)<=1}>−</button><span>{item.quantity}</span><button type="button" onClick={()=>updateQuantity(item,Number(item.quantity)+1)} disabled={updatingId===item.cart_item_id||Number(item.quantity)>=Number(item.stock)}>+</button></div><button type="button" className="ara-remove" onClick={()=>removeItem(item)} disabled={updatingId===item.cart_item_id}>Remove</button></div>
    </div><div className="ara-cart-item-price">{formatPrice(price(item))}</div>
   </article>})}</section>
   <section className="ara-order-form-wrap"><h2 className="ara-form-heading">Your Details</h2><form className="ara-order-form" onSubmit={checkout}>
    <div><label htmlFor="shipping_name">Full name</label><input id="shipping_name" type="text" name="shipping_name" value={formData.shipping_name} onChange={change} autoComplete="name" required/></div>
    <div><label htmlFor="shipping_phone">Phone number</label><input id="shipping_phone" type="tel" name="shipping_phone" value={formData.shipping_phone} onChange={change} autoComplete="tel" required/></div>
    <div><label htmlFor="shipping_email">Email address</label><input id="shipping_email" type="email" name="shipping_email" value={formData.shipping_email} onChange={change} autoComplete="email" required/></div>
    <div><label htmlFor="shipping_address">Address</label><textarea id="shipping_address" name="shipping_address" value={formData.shipping_address} onChange={change} autoComplete="street-address" required/></div>
    <div><label htmlFor="shipping_city">City</label><input id="shipping_city" type="text" name="shipping_city" value={formData.shipping_city} onChange={change} autoComplete="address-level2" required/></div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}><div><label htmlFor="shipping_state">State</label><input id="shipping_state" type="text" name="shipping_state" value={formData.shipping_state} onChange={change} autoComplete="address-level1" required/></div><div><label htmlFor="shipping_postal_code">Postal code</label><input id="shipping_postal_code" type="text" name="shipping_postal_code" value={formData.shipping_postal_code} onChange={change} autoComplete="postal-code" required/></div></div>
    <div><label htmlFor="shipping_country">Country</label><input id="shipping_country" type="text" name="shipping_country" value={formData.shipping_country} onChange={change} autoComplete="country-name" required/></div>
    <div className="ara-cart-total"><span>Current artwork total</span><strong>{formatPrice(subtotal)}</strong></div>
    <div className="ara-form-note">The artist will review your order and get in touch if any clarification is required. Payment options and the expected delivery date will be shared once your order is accepted.</div>
    <button type="submit" className="ara-submit" disabled={checkoutLoading}>{checkoutLoading?'Submitting order…':'Submit Order Request'}</button><p className="ara-order-caption">No payment is requested at this stage.</p>
   </form></section>
  </div>}
 </main>
}
function formatPrice(v){return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(v||0))}
