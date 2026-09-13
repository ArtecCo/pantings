import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

const API = 'http://localhost/paintings/api'

export default function PaintingDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [painting, setPainting] = useState(null)
  const [images, setImages] = useState([])
  const [activeImage, setActiveImage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewerOpen, setViewerOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef(null)

  const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `http://localhost${url}`
}

  useEffect(() => {
    loadPainting()
  }, [id])

  const loadPainting = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`${API}/paintings/get.php?id=${id}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Unable to load painting.')
      }

      const item = data.painting || data.data

      if (!item) {
        throw new Error('Painting not found.')
      }

      setPainting(item)

      if (Array.isArray(item.images) && item.images.length) {
        setImages(item.images)
      } else if (item.image_url) {
        setImages([{ image_url: item.image_url }])
      } else {
        setImages([])
      }
    } catch (err) {
      setError(err.message || 'Unable to load painting.')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = value => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Number(value || 0))
  }

  useEffect(() => {
    if (!viewerOpen) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setViewerOpen(false)
      }

      if (images.length > 1 && event.key === 'ArrowLeft') {
        setActiveImage((current) => (current - 1 + images.length) % images.length)
      }

      if (images.length > 1 && event.key === 'ArrowRight') {
        setActiveImage((current) => (current + 1) % images.length)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [viewerOpen, images.length])

  const openViewer = () => {
    if (!images.length || !images[activeImage]?.image_url) return
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setViewerOpen(true)
  }

  const closeViewer = () => {
    setViewerOpen(false)
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const changeViewerImage = (direction) => {
    if (images.length < 2) return

    setActiveImage((current) =>
      direction === 'next'
        ? (current + 1) % images.length
        : (current - 1 + images.length) % images.length
    )
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const zoomIn = () => {
    setZoom((current) => Math.min(3, Number((current + 0.25).toFixed(2))))
  }

  const zoomOut = () => {
    setZoom((current) => {
      const next = Math.max(1, Number((current - 0.25).toFixed(2)))
      if (next === 1) setPan({ x: 0, y: 0 })
      return next
    })
  }

  const resetZoom = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleZoomIn = () => {
    setZoom((current) => Math.min(3, Number((current + 0.25).toFixed(2))))
  }

  const handleImageMouseDown = (event) => {
    if (zoom <= 1) return

    event.preventDefault()
    setDragging(true)
    dragStart.current = {
      mouseX: event.clientX,
      mouseY: event.clientY,
      panX: pan.x,
      panY: pan.y
    }
  }

  const handleImageMouseMove = (event) => {
    if (!dragging || !dragStart.current) return

    setPan({
      x: dragStart.current.panX + (event.clientX - dragStart.current.mouseX),
      y: dragStart.current.panY + (event.clientY - dragStart.current.mouseY)
    })
  }

  const stopDragging = () => {
    setDragging(false)
    dragStart.current = null
  }

  const displayPrice = Number(
    painting?.discount_price || painting?.price || 0
  )

  const hasDiscount =
    painting?.discount_price &&
    Number(painting.discount_price) < Number(painting.price)

  if (loading) {
    return (
      <div className="ara-details-state">
        <span className="ara-loader"></span>
        <p>Preparing the artwork...</p>
      </div>
    )
  }

  if (error || !painting) {
    return (
      <div className="ara-details-state">
        <strong>Artwork unavailable</strong>
        <p>{error || 'This painting could not be found.'}</p>

        <Link to="/paintings" className="ara-btn ara-btn-primary">
          Return to Collection
        </Link>
      </div>
    )
  }

  return (
    <div className="ara-client">

      {/* Header */}
      <header className="ara-header">
        <div className="ara-header-inner">

          <Link to="/" className="ara-brand">
            <span className="ara-brand-small">THE HOUSE OF</span>
            <span className="ara-brand-name">ARAmane Arts</span>
          </Link>

          <nav className="ara-nav">
            <Link to="/">Home</Link>
            <Link to="/paintings">Collection</Link>
            <Link to="/about">Our Craft</Link>
          </nav>

          <div className="ara-header-actions">
            <Link to="/track-order" className="ara-track">
              Track Order
            </Link>

            <Link to="/cart" className="ara-cart">
              <span>Cart</span>
              <span className="ara-cart-count">0</span>
            </Link>

            <Link to="/login" className="ara-account">
              Account
            </Link>
          </div>

        </div>
      </header>

      <main className="ara-details">

        {/* Breadcrumb */}
        <div className="ara-breadcrumb">
          <Link to="/">Home</Link>
          <span>·</span>
          <Link to="/paintings">Collection</Link>
          <span>·</span>
          <strong>{painting.name}</strong>
        </div>

        <section className="ara-details-layout">

          {/* Gallery */}
          <div className="ara-gallery">

            <div className="ara-main-image">

              {images.length > 0 && images[activeImage]?.image_url ? (
                <div
                  className="ara-main-image-click-target"
                  onClick={openViewer}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      openViewer()
                    }
                  }}
                  aria-label="Open artwork viewer"
                >
                  <img
                    key={images[activeImage].image_url}
                    src={getImageUrl(images[activeImage].image_url)}
                    alt={painting.name}
                  />
                </div>
              ) : (
                <div className="ara-gallery-placeholder">
                  <span>ARAmane Arts</span>
                  <strong>Heritage</strong>
                </div>
              )}

              {painting.gold_details && (
                <div className="ara-detail-gold-badge">
                  ✦ 22K GOLD
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    className="ara-gallery-arrow ara-gallery-prev"
                    onClick={() =>
                      setActiveImage(
                        (activeImage - 1 + images.length) %
                        images.length
                      )
                    }
                    aria-label="Previous image"
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    className="ara-gallery-arrow ara-gallery-next"
                    onClick={() =>
                      setActiveImage(
                        (activeImage + 1) % images.length
                      )
                    }
                    aria-label="Next image"
                  >
                    ›
                  </button>
                </>
              )}

            </div>

            {images.length > 1 && (
              <div className="ara-gallery-thumbnails">

                {images.map((image, index) => (
                  <button
                    type="button"
                    key={image.id || image.image_url || index}
                    className={
                      index === activeImage
                        ? 'ara-thumbnail active'
                        : 'ara-thumbnail'
                    }
                    onClick={() => setActiveImage(index)}
                  >
                    <img
                      src={getImageUrl(image.image_url)}
                      alt={`${painting.name} view ${index + 1}`}
                    />
                  </button>
                ))}

              </div>
            )}

          </div>

          {/* Information */}
          <div className="ara-details-info">

            <div className="ara-detail-eyebrow">
              <span></span>
              {painting.category_name || 'HERITAGE ART'}
            </div>

            <h1>{painting.name}</h1>

            {painting.artist_name && (
              <p className="ara-detail-artist">
                Crafted by <strong>{painting.artist_name}</strong>
              </p>
            )}

            <div className="ara-detail-divider"></div>

            <div className="ara-detail-price">

              <strong>{formatPrice(displayPrice)}</strong>

              {hasDiscount && (
                <span>{formatPrice(painting.price)}</span>
              )}

            </div>

            <p className="ara-detail-description">
              {painting.description ||
                'A handcrafted work of Indian heritage art, created with traditional craftsmanship and devotion.'}
            </p>

            {/* Specifications */}
            <div className="ara-specifications">

              {(painting.width || painting.height) && (
                <div className="ara-spec">
                  <span>DIMENSIONS</span>
                  <strong>
                    {painting.width} × {painting.height} in
                  </strong>
                </div>
              )}

              {painting.medium && (
                <div className="ara-spec">
                  <span>MEDIUM</span>
                  <strong>{painting.medium}</strong>
                </div>
              )}

              {painting.frame && (
                <div className="ara-spec">
                  <span>FRAME</span>
                  <strong>{painting.frame}</strong>
                </div>
              )}

              {painting.gold_details && (
                <div className="ara-spec">
                  <span>GOLD DETAILS</span>
                  <strong>{painting.gold_details}</strong>
                </div>
              )}

            </div>

            {/* Purchase */}
            <div className="ara-purchase">

              <button
                type="button"
                className="ara-add-cart"
                onClick={() => {
                  // Cart functionality will be connected next.
                  navigate('/cart')
                }}
              >
                Add to Cart
                <span>✦</span>
              </button>

              <p>
                Your order will first be reviewed by our artist
                before payment is requested.
              </p>

            </div>

            {/* Assurance */}
            <div className="ara-detail-assurance">

              <div>
                <span>✦</span>
                <div>
                  <strong>Handcrafted</strong>
                  <small>Traditional craftsmanship</small>
                </div>
              </div>

              <div>
                <span>✦</span>
                <div>
                  <strong>Heritage Quality</strong>
                  <small>Made for generations</small>
                </div>
              </div>

            </div>

          </div>

        </section>

      </main>

      {viewerOpen && images.length > 0 && images[activeImage]?.image_url && (
        <div
          className="ara-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${painting.name} artwork viewer`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeViewer()
          }}
        >
          <div className="ara-lightbox-top">
            <div>
              <span>ARAmane Arts</span>
              <strong>{painting.name}</strong>
            </div>

            <button
              type="button"
              className="ara-lightbox-close"
              onClick={closeViewer}
              aria-label="Close artwork viewer"
            >
              ×
            </button>
          </div>

          <div className="ara-lightbox-stage">
            {images.length > 1 && (
              <button
                type="button"
                className="ara-lightbox-arrow ara-lightbox-prev"
                onClick={() => changeViewerImage('previous')}
                aria-label="Previous image"
              >
                ‹
              </button>
            )}

            <div
              className="ara-lightbox-image-wrap"
              onWheel={(event) => {
                event.preventDefault()
                setZoom((current) => {
                  const next = current + (event.deltaY < 0 ? 0.15 : -0.15)
                  const clamped = Math.min(3, Math.max(1, Number(next.toFixed(2))))
                  if (clamped === 1) setPan({ x: 0, y: 0 })
                  return clamped
                })
              }}
              onMouseMove={handleImageMouseMove}
              onMouseUp={stopDragging}
              onMouseLeave={stopDragging}
            >
              <img
                src={getImageUrl(images[activeImage].image_url)}
                alt={painting.name}
                draggable={false}
                onMouseDown={handleImageMouseDown}
                onDoubleClick={resetZoom}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  cursor: zoom > 1
                    ? (dragging ? 'grabbing' : 'grab')
                    : 'zoom-in',
                  transition: dragging ? 'none' : 'transform .18s ease'
                }}
              />
            </div>

            {images.length > 1 && (
              <button
                type="button"
                className="ara-lightbox-arrow ara-lightbox-next"
                onClick={() => changeViewerImage('next')}
                aria-label="Next image"
              >
                ›
              </button>
            )}
          </div>

          <div className="ara-lightbox-controls">
            <button type="button" onClick={zoomOut} disabled={zoom <= 1}>
              −
            </button>

            <button type="button" onClick={resetZoom}>
              {Math.round(zoom * 100)}%
            </button>

            <button type="button" onClick={zoomIn} disabled={zoom >= 3}>
              +
            </button>
          </div>

          {images.length > 1 && (
            <div className="ara-lightbox-counter">
              {activeImage + 1} / {images.length}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="ara-footer">
        <div className="ara-footer-inner">

          <div className="ara-footer-brand">
            <span>THE HOUSE OF</span>
            <strong>ARAmane Arts</strong>
            <p>
              Preserving India's sacred artistic traditions,
              one handcrafted painting at a time.
            </p>
          </div>

          <div className="ara-footer-column">
            <h3>Explore</h3>
            <Link to="/">Home</Link>
            <Link to="/paintings">Collection</Link>
            <Link to="/about">Our Craft</Link>
          </div>

          <div className="ara-footer-column">
            <h3>Assistance</h3>
            <Link to="/contact">Contact Us</Link>
            <Link to="/track-order">Track Order</Link>
            <Link to="/faq">FAQs</Link>
          </div>

        </div>

        <div className="ara-footer-bottom">
          <span>© {new Date().getFullYear()} ARAmane Arts</span>
          <span>Crafted with reverence for Indian heritage</span>
        </div>
      </footer>

    </div>
  )
}