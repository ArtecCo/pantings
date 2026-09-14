import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiUrl } from '../config/api'
import { useToast } from '../components/ToastProvider'

const viewerStyles = `
.ara-art-viewer{position:fixed;inset:0;z-index:10000;background:#160c08;color:#fdfbf7;display:flex;flex-direction:column;overflow:hidden}
.ara-art-viewer *{box-sizing:border-box}
.ara-art-viewer-head{height:72px;flex:0 0 72px;display:flex;align-items:center;justify-content:space-between;padding:12px 22px;border-bottom:1px solid rgba(212,175,55,.35);background:#21110c}
.ara-art-viewer-title{min-width:0;display:flex;flex-direction:column;gap:2px}.ara-art-viewer-title small{color:#d4af37;font:600 9px 'DM Sans',sans-serif;letter-spacing:.2em;text-transform:uppercase}.ara-art-viewer-title strong{font:600 22px 'Cormorant Garamond',serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ara-art-viewer-close{width:44px;height:44px;flex:0 0 44px;border:1px solid #d4af37;border-radius:50%;background:transparent;color:#fdfbf7;font-size:28px;line-height:1;cursor:pointer}.ara-art-viewer-close:hover{background:#d4af37;color:#2c1810}
.ara-art-viewer-stage{position:relative;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:18px 76px;overflow:hidden;background:radial-gradient(circle at center,rgba(212,175,55,.08),transparent 45%)}
.ara-art-viewer-canvas{position:relative;max-width:100%;max-height:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;touch-action:none;user-select:none}
.ara-art-viewer-image{display:block;width:auto;height:auto;max-width:calc(100vw - 170px);max-height:calc(100vh - 190px);object-fit:contain;border:2px solid #d4af37;box-shadow:0 18px 55px rgba(0,0,0,.5);transform-origin:center center;will-change:transform;user-select:none}
.ara-art-viewer-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:3;width:48px;height:48px;border:1px solid #d4af37;border-radius:50%;background:rgba(22,12,8,.88);color:#fdfbf7;font:38px/38px 'Cormorant Garamond',serif;cursor:pointer}.ara-art-viewer-arrow:hover{background:#d4af37;color:#2c1810}.ara-art-viewer-prev{left:18px}.ara-art-viewer-next{right:18px}
.ara-art-viewer-bar{height:62px;flex:0 0 62px;display:flex;align-items:center;justify-content:center;gap:8px;border-top:1px solid rgba(212,175,55,.25);background:#21110c}.ara-art-viewer-bar button{height:38px;min-width:42px;padding:0 13px;border:1px solid rgba(212,175,55,.75);background:#2c1810;color:#fdfbf7;cursor:pointer;font:500 13px 'DM Sans',sans-serif}.ara-art-viewer-bar button:hover:not(:disabled){background:#d4af37;color:#2c1810}.ara-art-viewer-bar button:disabled{opacity:.35;cursor:default}.ara-art-viewer-help{height:30px;flex:0 0 30px;text-align:center;color:rgba(253,251,247,.55);font:9px/30px 'DM Sans',sans-serif;letter-spacing:.1em;background:#21110c}
.ara-detail-intro{width:min(900px,calc(100% - 48px));margin:0 auto;padding:48px 0 54px;text-align:center}.ara-detail-intro-kicker{display:flex;justify-content:center;align-items:center;gap:12px;color:var(--gold);font-size:10px;font-weight:600;letter-spacing:.22em;text-transform:uppercase}.ara-detail-intro-kicker span{width:28px;height:1px;background:var(--gold)}.ara-detail-intro h1{margin:13px 0 12px;color:var(--maroon);font-family:'Cormorant Garamond',serif;font-size:clamp(34px,4vw,52px);line-height:1;font-weight:500}.ara-detail-intro-artist{margin:0 0 22px;color:var(--muted);font-size:12px}.ara-detail-intro-artist strong{color:var(--brown);font-weight:600}.ara-detail-intro-description{max-width:720px;margin:0 auto;color:var(--muted);font-size:14px;line-height:1.9;text-align:left}.ara-detail-intro-description p{margin:0 0 13px}.ara-detail-intro-description p:last-child{margin-bottom:0}
.ara-detail-body{border-top:1px solid var(--border);padding-top:58px}
.ara-detail-body .ara-details-info> .ara-detail-eyebrow{display:none}
.ara-detail-body .ara-details-info>h1{display:none}
.ara-detail-body .ara-details-info>.ara-detail-artist{display:none}
.ara-detail-body .ara-details-info>.ara-detail-description{display:none}
.ara-detail-body .ara-detail-assurance{display:none!important}
@media(max-width:600px){.ara-detail-intro{width:min(100% - 30px,900px);padding:34px 0 38px}.ara-detail-intro h1{font-size:35px}.ara-detail-intro-description{font-size:13px;line-height:1.8}.ara-detail-body{padding-top:34px}}
@media(max-width:600px){.ara-art-viewer-head{height:60px;flex-basis:60px;padding:9px 12px}.ara-art-viewer-title small{font-size:8px}.ara-art-viewer-title strong{font-size:19px;max-width:72vw}.ara-art-viewer-close{width:38px;height:38px;flex-basis:38px;font-size:25px}.ara-art-viewer-stage{padding:10px 12px}.ara-art-viewer-canvas{width:100%;height:100%}.ara-art-viewer-image{max-width:calc(100vw - 24px);max-height:calc(100vh - 132px)}.ara-art-viewer-arrow{width:38px;height:38px;font-size:29px;line-height:32px}.ara-art-viewer-prev{left:6px}.ara-art-viewer-next{right:6px}.ara-art-viewer-bar{height:54px;flex-basis:54px}.ara-art-viewer-bar button{height:34px;min-width:38px;padding:0 10px}.ara-art-viewer-help{display:none}}
@media(min-width:901px){.ara-menu-toggle{display:none!important}}
@media(max-width:600px){.ara-main-image{width:100%!important;max-width:100%!important;overflow:hidden}.ara-main-image-click-target{width:100%!important;max-width:100%!important}.ara-main-image-click-target img{width:100%!important;height:auto!important;max-width:100%!important;max-height:none!important;object-fit:contain}}
`

export default function PaintingDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [painting, setPainting] = useState(null), [images, setImages] = useState([]), [activeImage, setActiveImage] = useState(0), [loading, setLoading] = useState(true), [error, setError] = useState('')
  const [viewerOpen, setViewerOpen] = useState(false), [zoom, setZoom] = useState(1), [pan, setPan] = useState({ x: 0, y: 0 }), [dragging, setDragging] = useState(false)
  const dragStart = useRef(null)
  const getImageUrl = url => !url ? '' : url.startsWith('http') ? url : `${new URL(apiUrl('')).origin}${url}`

  useEffect(() => { loadPainting() }, [id])
  useEffect(() => {
    if (!viewerOpen) return
    const key = e => {
      if (e.key === 'Escape') closeViewer()
      if (images.length > 1 && e.key === 'ArrowLeft') changeViewerImage('previous')
      if (images.length > 1 && e.key === 'ArrowRight') changeViewerImage('next')
      if (e.key === '+' || e.key === '=') zoomIn()
      if (e.key === '-') zoomOut()
      if (e.key === '0') resetZoom()
    }
    document.addEventListener('keydown', key)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = previousOverflow }
  }, [viewerOpen, images.length, activeImage, zoom, pan])

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
      toast.success('Painting added to your cart.'); setTimeout(() => navigate('/cart'), 500)
    } catch (e) { toast.error(e.message || 'Unable to add this painting to your cart.') }
  }

  const openViewer = () => { if (images[activeImage]?.image_url) { setZoom(1); setPan({ x: 0, y: 0 }); setViewerOpen(true) } }
  const closeViewer = () => { setViewerOpen(false); setZoom(1); setPan({ x: 0, y: 0 }); setDragging(false); dragStart.current = null }
  const changeViewerImage = direction => { if (images.length < 2) return; setActiveImage(current => direction === 'next' ? (current + 1) % images.length : (current - 1 + images.length) % images.length); setZoom(1); setPan({ x: 0, y: 0 }) }
  const zoomIn = () => setZoom(z => Math.min(4, Number((z + .25).toFixed(2))))
  const zoomOut = () => setZoom(z => { const next = Math.max(1, Number((z - .25).toFixed(2))); if (next === 1) setPan({ x: 0, y: 0 }); return next })
  const resetZoom = () => { setZoom(1); setPan({ x: 0, y: 0 }) }
  const startDrag = e => { if (zoom <= 1) return; e.preventDefault(); setDragging(true); dragStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y } }
  const moveDrag = e => { if (!dragging || !dragStart.current) return; setPan({ x: dragStart.current.px + e.clientX - dragStart.current.x, y: dragStart.current.py + e.clientY - dragStart.current.y }) }
  const stopDrag = () => { setDragging(false); dragStart.current = null }
  const wheelZoom = e => { e.preventDefault(); setZoom(z => { const next = Math.min(4, Math.max(1, Number((z + (e.deltaY < 0 ? .2 : -.2)).toFixed(2)))); if (next === 1) setPan({ x: 0, y: 0 }); return next }) }
  const handlePointerDown = e => { if (e.pointerType === 'mouse') startDrag(e); else if (zoom > 1) startDrag(e) }
  const handlePointerMove = e => moveDrag(e)
  const handlePointerUp = () => stopDrag()

  const displayPrice = Number(painting?.discount_price || painting?.price || 0), hasDiscount = painting?.discount_price && Number(painting.discount_price) < Number(painting.price)
  const formatPrice = v => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(v || 0))
  if (loading) return <div className="ara-details-state"><span className="ara-loader"></span><p>Preparing the artwork...</p></div>
  if (error || !painting) return <div className="ara-details-state"><strong>Artwork unavailable</strong><p>{error || 'This painting could not be found.'}</p><Link to="/paintings" className="ara-btn ara-btn-primary">Return to Collection</Link></div>
  const currentImage = images[activeImage]
  const descriptionParagraphs = String(painting.description || 'A handcrafted work of Indian heritage art, created with traditional craftsmanship and devotion.').split(/\n\s*\n|\r?\n/).map(text => text.trim()).filter(Boolean)

  return <>
    <style>{viewerStyles}</style>
    <main className="ara-details">
      <div className="ara-breadcrumb"><Link to="/">Home</Link><span>·</span><Link to="/paintings">Collection</Link><span>·</span><strong>{painting.name}</strong></div>

      <section className="ara-product-top">
        <div className="ara-gallery">
          <div className="ara-main-image">
            {currentImage?.image_url ? <button type="button" className="ara-main-image-click-target" onClick={openViewer} aria-label={`Open ${painting.name} in artwork viewer`}><img src={getImageUrl(currentImage.image_url)} alt={painting.name} /></button> : <div className="ara-gallery-placeholder"><span>ARAmane Arts</span><strong>Heritage</strong></div>}
            {painting.gold_details && <div className="ara-detail-gold-badge">✦ 22K GOLD</div>}
            {images.length > 1 && <><button type="button" className="ara-gallery-arrow ara-gallery-prev" onClick={() => changeViewerImage('previous')}>‹</button><button type="button" className="ara-gallery-arrow ara-gallery-next" onClick={() => changeViewerImage('next')}>›</button></>}
          </div>
          {images.length > 1 && <div className="ara-gallery-thumbnails">{images.map((image, i) => <button type="button" key={image.id || image.image_url || i} className={i === activeImage ? 'ara-thumbnail active' : 'ara-thumbnail'} onClick={() => setActiveImage(i)}><img src={getImageUrl(image.image_url)} alt={`${painting.name} view ${i + 1}`} /></button>)}</div>}
        </div>

        <div className="ara-product-info">
          <div className="ara-detail-eyebrow"><span></span>{painting.category_name || 'HERITAGE ART'}<span></span></div>
          <h1>{painting.name}</h1>
          {painting.artist_name && <p className="ara-detail-artist">Crafted by <strong>{painting.artist_name}</strong></p>}
          <div className="ara-detail-divider"></div>
          <div className="ara-detail-price"><strong>{formatPrice(displayPrice)}</strong>{hasDiscount && <span>{formatPrice(painting.price)}</span>}</div>
          <div className="ara-specifications">{(painting.width || painting.height) && <div className="ara-spec"><span>DIMENSIONS</span><strong>{painting.width} × {painting.height} in</strong></div>}{painting.medium && <div className="ara-spec"><span>MEDIUM</span><strong>{painting.medium}</strong></div>}{painting.frame && <div className="ara-spec"><span>FRAME</span><strong>{painting.frame}</strong></div>}{painting.gold_details && <div className="ara-spec"><span>GOLD DETAILS</span><strong>{painting.gold_details}</strong></div>}</div>
          <div className="ara-purchase"><button type="button" className="ara-add-cart" onClick={addToCart}>Add to Cart<span>✦</span></button><p>Your order will first be reviewed by our artist before payment is requested.</p></div>
        </div>
      </section>

      <section className="ara-artwork-description">
        <div className="ara-detail-intro-description">{descriptionParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
      </section>
    </main>

    {viewerOpen && images.length > 0 && <div className="ara-art-viewer" role="dialog" aria-modal="true" aria-label={`${painting.name} artwork viewer`}>
      <div className="ara-art-viewer-head"><div className="ara-art-viewer-title"><small>ARAmane Arts · Artwork Viewer</small><strong>{painting.name}</strong></div><button type="button" className="ara-art-viewer-close" onClick={closeViewer} aria-label="Close artwork viewer">×</button></div>
      <div className="ara-art-viewer-stage" onMouseMove={handlePointerMove} onMouseUp={handlePointerUp} onMouseLeave={handlePointerUp} onWheel={wheelZoom}>
        {images.length > 1 && <button type="button" className="ara-art-viewer-arrow ara-art-viewer-prev" onClick={() => changeViewerImage('previous')} aria-label="Previous image">‹</button>}
        <div className="ara-art-viewer-canvas" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
          <img className="ara-art-viewer-image" src={getImageUrl(images[activeImage].image_url)} alt={painting.name} draggable={false} onDoubleClick={resetZoom} style={{ transform: `translate3d(${pan.x}px,${pan.y}px,0) scale(${zoom})`, cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in' }} />
        </div>
        {images.length > 1 && <button type="button" className="ara-art-viewer-arrow ara-art-viewer-next" onClick={() => changeViewerImage('next')} aria-label="Next image">›</button>}
      </div>
      <div className="ara-art-viewer-bar"><button type="button" onClick={zoomOut} disabled={zoom <= 1}>−</button><button type="button" onClick={resetZoom}>{Math.round(zoom * 100)}%</button><button type="button" onClick={zoomIn} disabled={zoom >= 4}>+</button></div>
      <div className="ara-art-viewer-help">{activeImage + 1} / {images.length} · {zoom > 1 ? 'DRAG TO INSPECT' : 'CLICK + OR USE MOUSE WHEEL TO ZOOM'} · ESC TO CLOSE</div>
    </div>}
  </>
}
