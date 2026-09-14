import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const API = 'http://localhost/paintings/api'

export default function Paintings() {
  const [paintings, setPaintings] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imageIndexes, setImageIndexes] = useState({})

  const getImageUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    return `http://localhost${url}`
  }

  useEffect(() => {
    loadPaintings()
    loadCategories()
  }, [])

  const loadPaintings = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch(`${API}/paintings/list.php`)
      const data = await response.json()
      if (!data.success) throw new Error(data.message || 'Unable to load paintings.')
      const available = (data.paintings || data.data || []).filter(painting => Number(painting.is_active) === 1)
      setPaintings(available)
    } catch (err) {
      setError(err.message || 'Unable to load the collection.')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API}/categories/list.php`)
      const data = await response.json()
      if (data.success) setCategories(data.categories || data.data || [])
    } catch {
      // Category loading should not prevent the collection from loading.
    }
  }

  const filteredPaintings = useMemo(() => {
    const term = search.trim().toLowerCase()
    return paintings.filter(painting => {
      const matchesCategory = category === 'all' || String(painting.category_id) === String(category)
      const matchesSearch = !term || String(painting.name || '').toLowerCase().includes(term) || String(painting.artist_name || '').toLowerCase().includes(term) || String(painting.category_name || '').toLowerCase().includes(term)
      return matchesCategory && matchesSearch
    })
  }, [paintings, search, category])

  const getImages = painting => {
    if (Array.isArray(painting.images) && painting.images.length) return painting.images
    if (painting.image_url) return [{ image_url: painting.image_url }]
    return []
  }

  const changeImage = (paintingId, direction, imageCount) => {
    setImageIndexes(current => {
      const currentIndex = current[paintingId] || 0
      const nextIndex = (currentIndex + direction + imageCount) % imageCount
      return { ...current, [paintingId]: nextIndex }
    })
  }

  const formatPrice = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0))

  return (
    <main className="ara-collection">
      <section className="ara-collection-hero">
        <div className="ara-collection-hero-copy">
          <div className="ara-collection-kicker"><span></span> THE ARAmane COLLECTION</div>
          <h1>Art made to be cherished.</h1>
          <p>Original Thanjavur paintings, handcrafted with devotion, layered with 22K gold leaf and created to become part of your home and heritage.</p>
        </div>
      </section>

      <section className="ara-collection-toolbar">
        <div className="ara-search-box"><span>⌕</span><input type="search" placeholder="Search the collection" value={search} onChange={event => setSearch(event.target.value)} /></div>
        <div className="ara-category-filters" aria-label="Filter by category">
          <button type="button" className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}>All works</button>
          {categories.filter(item => Number(item.is_active) === 1).map(item => <button type="button" key={item.id} className={String(category) === String(item.id) ? 'active' : ''} onClick={() => setCategory(item.id)}>{item.name}</button>)}
        </div>
      </section>

      {loading && <div className="ara-collection-state"><span className="ara-loader"></span><p>Preparing the collection...</p></div>}
      {!loading && error && <div className="ara-collection-state ara-error-state"><strong>Unable to load the collection</strong><p>{error}</p><button type="button" onClick={loadPaintings}>Try Again</button></div>}
      {!loading && !error && filteredPaintings.length === 0 && <div className="ara-collection-state"><strong>No paintings found.</strong><p>Try another search or category.</p></div>}

      {!loading && !error && filteredPaintings.length > 0 && (
        <section className="ara-painting-grid">
          {filteredPaintings.map(painting => {
            const images = getImages(painting)
            const currentIndex = imageIndexes[painting.id] || 0
            const currentImage = images[currentIndex]
            return (
              <article className="ara-painting-card" key={painting.id}>
                <Link to={`/paintings/${painting.id}`} className="ara-painting-image">
                  {currentImage?.image_url ? <img src={getImageUrl(currentImage.image_url)} alt={painting.name} /> : <div className="ara-no-image"><span>ARAmane Arts</span><strong>Heritage</strong></div>}
                  {painting.gold_details && <span className="ara-gold-badge">22K GOLD</span>}
                  {images.length > 1 && <>
                    <button type="button" className="ara-image-arrow ara-image-prev" onClick={event => { event.preventDefault(); event.stopPropagation(); changeImage(painting.id, -1, images.length) }} aria-label="Previous image">‹</button>
                    <button type="button" className="ara-image-arrow ara-image-next" onClick={event => { event.preventDefault(); event.stopPropagation(); changeImage(painting.id, 1, images.length) }} aria-label="Next image">›</button>
                    <span className="ara-image-counter">{currentIndex + 1} / {images.length}</span>
                  </>}
                </Link>
                <div className="ara-painting-info">
                  <div className="ara-painting-meta"><span>{painting.category_name || 'Heritage Art'}</span>{painting.medium && <span>{painting.medium}</span>}</div>
                  <h2>{painting.name}</h2>
                  {painting.artist_name && <p className="ara-painting-artist">By {painting.artist_name}</p>}
                  <div className="ara-painting-bottom">
                    <div>{(painting.width || painting.height) && <span className="ara-dimensions">{painting.width} × {painting.height} in</span>}<strong>{formatPrice(painting.discount_price || painting.price)}</strong></div>
                    <Link to={`/paintings/${painting.id}`} className="ara-card-arrow" aria-label={`View ${painting.name}`}>→</Link>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
