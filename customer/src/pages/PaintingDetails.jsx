import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiUrl } from '../config/api'
import { useToast } from '../components/ToastProvider'

export default function PaintingDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [painting, setPainting] = useState(null), [images, setImages] = useState([]), [activeImage, setActiveImage] = useState(0), [loading, setLoading] = useState(true), [error, setError] = useState('')
  const [viewerOpen, setViewerOpen] = useState(false), [zoom, setZoom] = useState(1), [pan, setPan] = useState({ x: 0, y: 0 }), [dragging, setDragging] = useState(false)
  const [touchStart, setTouchStart] = useState(null)
  const dragStart = useRef(null)
  const getImageUrl = url => !url ? '' : url.startsWith('http') ? url : `${new URL(apiUrl('')).origin}${url}`

  useEffect(() => { loadPainting() }, [id])

  const loadPainting = async () => {
    try {
      setLoading(true); setError('')
      const r = await fetch(apiUrl(`paintings/get.php?id=${encodeURIComponent(id)}`))
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.success) throw new Error(d.message || 'Unable to load painting.')
      const item = d.painting || d.data
      if (!item) throw new Error('Painting not found.')
      setPainting(item)
      setImages(Array.isArray(item.images) && item.images.length ? item.images : item.image_url ? [{ image_url: item.image_url }] : [])
    } catch (e) { setError(e.message || 'Unable to load painting.') }
    finally { setLoading(false) }
  }

  const addToCart = async () => {
    try {
      const r = await fetch(apiUrl('cart/add-item.php'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ painting_id: Number(id), quantity: 1 }) })
      const d = await r.json().catch(() => ({}))
      if (r.status === 401) { toast.error('Please sign in to add items to your cart.'); navigate('/login'); return }
      if (!r.ok || !d.success) throw new Error(d.message || 'Unable to add this painting to your cart.')
      toast.success('Painting added to your cart.')
      setTimeout(() => navigate('/cart'), 500)
    } catch (e) { toast.error(e.message || 'Unable to add this painting to your cart.') }
  }

  useEffect(() => {
    if (!viewerOpen) return
    const k = e => {
      if (e.key === 'Escape') closeViewer()
      if (images.length > 1 && e.key === 'ArrowLeft') changeViewerImage('previous')
      if (images.length > 1 && e.key === 'ArrowRight') changeViewerImage('next')
      if (e.key === '+' || e.key === '=') zoomIn()
      if (e.key === '-') zoomOut()
      if (e.key === '0') resetZoom()
    }
    document.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [viewerOpen, images.length, activeImage, zoom, pan])

  const openViewer = () => {
    if (!images.length || !images[activeImage]?.image_url) return
    setZoom(1); setPan({ x: 0, y: 0 }); setViewerOpen(true)
  }

  const closeViewer = () => {
    setViewerOpen(false); setZoom(1); setPan({ x: 0, y: 0 }); setDragging(false); dragStart.current = null; setTouchStart(null)
  }

  const changeViewerImage = direction => {
    if (images.length < 2) return
    setActiveImage(current => direction === 'next' ? (current + 1) % images.length : (current - 1 + images.length) % images.length)
    setZoom(1); setPan({ x: 0, y: 0 })
  }

  const zoomIn = () => setZoom(current => Math.min(3, Number((current + 0.25).toFixed(2))))
  const zoomOut = () => setZoom(current => {
    const next = Math.max(1, Number((current - 0.25).toFixed(2)))
    if (next === 1) setPan({ x: 0, y: 0 })
    return next
  })
  const resetZoom = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  const handleImageMouseDown = event => {
    if (zoom <= 1) return
    event.preventDefault()
    setDragging(true)
    dragStart.current = { mouseX: event.clientX, mouseY: event.clientY, panX: pan.x, panY: pan.y }
  }

  const handleImageMouseMove = event => {
    if (!dragging || !dragStart.current) return
    setPan({ x: dragStart.current.panX + (event.clientX - dragStart.current.mouseX), y: dragStart.current.panY + (event.clientY - dragStart.current.mouseY) })
  }

  const stopDragging = () => { setDragging(false); dragStart.current = null }

  const handleWheel = event => {
    event.preventDefault()
    setZoom(current => {
      const next = current + (event.deltaY < 0 ? 0.15 : -0.15)
      const clamped = Math.min(3, Math.max(1, Number(next.toFixed(2))))
      if (clamped === 1) setPan({ x: 0, y: 0 })
      return clamped
    })
  }

  const handleTouchStart = event => {
    if (event.touches.length !== 1) return
    setTouchStart({ x: event.touches[0].clientX, y: event.touches[0].clientY, time: Date.now() })
  }

  const handleTouchEnd = event => {
    if (!touchStart || zoom > 1 || !images.length) return
    const touch = event.changedTouches[0]
    const dx = touch.clientX - touchStart.x
    const dy = touch.clientY - touchStart.y
    const elapsed = Date.now() - touchStart.time
    if (elapsed < 500 && Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) changeViewerImage(dx < 0 ? 'next' : 'previous')
    setTouchStart(null)
  }

  const displayPrice = Number(painting?.discount_price || painting?.price || 0), hasDiscount = painting?.discount_price && Number(painting.discount_price) < Number(painting.price)
  const formatPrice = v => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(v || 0))
  if (loading) return <div className="ara-details-state"><span className="ara-loader"></span><p>Preparing the artwork...</p></div>
  if (error || !painting) return <div className="ara-details-state"><strong>Artwork unavailable</strong><p>{error || 'This painting could not be found.'}</p><Link to="/paintings" className="ara-btn ara-btn-primary">Return to Collection</Link></div>
  const currentImage = images[activeImage]

  return <>
    <main className="ara-details">
      <div className="ara-breadcrumb"><Link to="/">Home</Link><span>·</span><Link to="/paintings">Collection</Link><span>·</span><strong>{painting.name}</strong></div>
      <section className="ara-details-layout">
        <div className="ara-gallery">
          <div className="ara-main-image">
            {currentImage?.image_url ? <div className="ara-main-image-click-target" onClick={openViewer} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openViewer() } }}><img src={getImageUrl(currentImage.image_url)} alt={painting.name} /></div> : <div className="ara-gallery-placeholder"><span>ARAmane Arts</span><strong>Heritage</strong></div>}
            {painting.gold_details && <div className="ara-detail-gold-badge">✦ 22K GOLD</div>}
            {images.length > 1 && <><button type="button" className="ara-gallery-arrow ara-gallery-prev" onClick={() => setActiveImage((activeImage - 1 + images.length) % images.length)}>‹</button><button type="button" className="ara-gallery-arrow ara-gallery-next" onClick={() => setActiveImage((activeImage + 1) % images.length)}>›</button></>}
          </div>
          {images.length > 1 && <div className="ara-gallery-thumbnails">{images.map((image, i) => <button type="button" key={image.id || image.image_url || i} className={i === activeImage ? 'ara-thumbnail active' : 'ara-thumbnail'} onClick={() => setActiveImage(i)}><img src={getImageUrl(image.image_url)} alt={`${painting.name} view ${i + 1}`} /></button>)}</div>}
        </div>
        <div className="ara-details-info">
          <div className="ara-detail-eyebrow"><span></span>{painting.category_name || 'HERITAGE ART'}</div>
          <h1>{painting.name}</h1>
          {painting.artist_name && <p className="ara-detail-artist">Crafted by <strong>{painting.artist_name}</strong></p>}
          <div className="ara-detail-divider"></div>
          <div className="ara-detail-price"><strong>{formatPrice(displayPrice)}</strong>{hasDiscount && <span>{formatPrice(painting.price)}</span>}</div>
          <p className="ara-detail-description">{painting.description || 'A handcrafted work of Indian heritage art, created with traditional craftsmanship and devotion.'}</p>
          <div className="ara-specifications">{(painting.width || painting.height) && <div className="ara-spec"><span>DIMENSIONS</span><strong>{painting.width} × {painting.height} in</strong></div>}{painting.medium && <div className="ara-spec"><span>MEDIUM</span><strong>{painting.medium}</strong></div>}{painting.frame && <div className="ara-spec"><span>FRAME</span><strong>{painting.frame}</strong></div>}{painting.gold_details && <div className="ara-spec"><span>GOLD DETAILS</span><strong>{painting.gold_details}</strong></div>}</div>
          <div className="ara-purchase"><button type="button" className="ara-add-cart" onClick={addToCart}>Add to Cart<span>✦</span></button><p>Your order will first be reviewed by our artist before payment is requested.</p></div>
          <div className="ara-detail-assurance"><div><span>✦</span><div><strong>Handcrafted</strong><small>Traditional craftsmanship</small></div></div><div><span>✦</span><div><strong>Heritage Quality</strong><small>Made for generations</small></div></div></div>
        </div>
      </section>
    </main>

    {viewerOpen && images.length > 0 && <div className="ara-lightbox" role="dialog" aria-modal="true" aria-label={`${painting.name} artwork viewer`} onMouseDown={e => e.target === e.currentTarget && closeViewer()}>
      <div className="ara-lightbox-top">
        <div><span>ARAmane Arts · Artwork Viewer</span><strong>{painting.name}</strong></div>
        <button type="button" className="ara-lightbox-close" onClick={closeViewer} aria-label="Close artwork viewer">×</button>
      </div>
      <div className="ara-lightbox-stage" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {images.length > 1 && <button type="button" className="ara-lightbox-arrow ara-lightbox-prev" onClick={() => changeViewerImage('previous')} aria-label="Previous artwork">‹</button>}
        <div className="ara-lightbox-image-wrap" onWheel={handleWheel} onMouseMove={handleImageMouseMove} onMouseUp={stopDragging} onMouseLeave={stopDragging}>
          <img src={getImageUrl(images[activeImage].image_url)} alt={painting.name} draggable={false} onMouseDown={handleImageMouseDown} onDoubleClick={resetZoom} style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`, cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in' }} />
        </div>
        {images.length > 1 && <button type="button" className="ara-lightbox-arrow ara-lightbox-next" onClick={() => changeViewerImage('next')} aria-label="Next artwork">›</button>}
      </div>
      <div className="ara-lightbox-controls">
        <button type="button" onClick={zoomOut} disabled={zoom <= 1} aria-label="Zoom out">−</button>
        <button type="button" onClick={resetZoom} aria-label="Reset zoom">{Math.round(zoom * 100)}%</button>
        <button type="button" onClick={zoomIn} disabled={zoom >= 3} aria-label="Zoom in">+</button>
      </div>
      <div className="ara-lightbox-counter">{activeImage + 1} / {images.length} · {zoom === 1 ? 'Swipe or use arrows to browse' : 'Drag to inspect'} · Double-click to reset</div>
    </div>}
  </>
}
