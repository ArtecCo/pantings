import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'

export default function PaintingList() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [paintings, setPaintings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')
  const [imageIndexes, setImageIndexes] = useState({})

  const [statusPrompt, setStatusPrompt] = useState(null)
  const [statusUpdating, setStatusUpdating] = useState(false)

  const loadPaintings = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API}/paintings/list.php`, { credentials: 'include' })
      const data = await response.json()
      if (!data.success) { setError(data.message || 'Unable to load paintings'); return }
      setPaintings(data.paintings || [])
    } catch (err) {
      console.error(err)
      setError('Unable to connect to the server')
    } finally { setLoading(false) }
  }

  useEffect(() => { loadPaintings() }, [])

  const filteredPaintings = useMemo(() => {
    const term = search.trim().toLowerCase()
    return paintings.filter((painting) => {
      const matchesSearch = !term || painting.name?.toLowerCase().includes(term) || painting.category_name?.toLowerCase().includes(term) || painting.frame?.toLowerCase().includes(term)
      const matchesFilter = filter === 'all' || (filter === 'active' && Number(painting.is_active) === 1) || (filter === 'inactive' && Number(painting.is_active) === 0) || (filter === 'featured' && Number(painting.is_featured) === 1)
      return matchesSearch && matchesFilter
    })
  }, [paintings, search, filter])

  return (
    <div className="painting-list-page">
      <div className="page-header painting-list-header">
        <div><span className="eyebrow">ART COLLECTION</span><h1>Paintings</h1><p>Curate and manage the ARAmane Arts collection.</p></div>
        <button className="gold-outline-button" onClick={() => navigate('/paintings/new')}>+ Add Painting</button>
      </div>
      <div className="gold-rule" />
      <div className="painting-toolbar">
        <div className="painting-search"><span>⌕</span><input type="text" placeholder="Search paintings, categories or frames..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <div className="painting-filters">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
          <button className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>Available</button>
          <button className={filter === 'inactive' ? 'active' : ''} onClick={() => setFilter('inactive')}>Unavailable</button>
          <button className={filter === 'featured' ? 'active' : ''} onClick={() => setFilter('featured')}>Featured</button>
        </div>
      </div>
      {loading && <div className="painting-list-message"><span>✦</span>Loading the collection...</div>}
      {!loading && error && <div className="painting-list-message painting-list-error">{error}</div>}
      {!loading && !error && filteredPaintings.length === 0 && <div className="painting-list-empty"><div className="empty-symbol">✦</div><h2>{paintings.length === 0 ? 'The collection awaits its first masterpiece' : 'No paintings found'}</h2><p>{paintings.length === 0 ? 'Add your first artwork to begin building the ARAmane Arts collection.' : 'Try changing your search or filter.'}</p>{paintings.length === 0 && <button className="gold-outline-button" onClick={() => navigate('/paintings/new')}>Add First Painting</button>}</div>}
      {!loading && !error && filteredPaintings.length > 0 && (
        <div className="painting-grid">
          {filteredPaintings.map((painting) => (
            <article className={`painting-card ${Number(painting.is_active) === 0 ? 'painting-card-unavailable' : ''}`} key={painting.id}>
              <div className="painting-card-image">
                {painting.images?.length > 0 ? <>
                  <img src={`http://api.arts.araha.co.in${painting.images[imageIndexes[painting.id] || 0].image_url}`} alt={painting.name} />
                  {painting.images.length > 1 && <>
                    <button type="button" className="painting-image-nav painting-image-prev" onClick={() => { const currentIndex = imageIndexes[painting.id] || 0; const nextIndex = currentIndex === 0 ? painting.images.length - 1 : currentIndex - 1; setImageIndexes(current => ({ ...current, [painting.id]: nextIndex })) }} aria-label="Previous image">‹</button>
                    <button type="button" className="painting-image-nav painting-image-next" onClick={() => { const currentIndex = imageIndexes[painting.id] || 0; const nextIndex = currentIndex === painting.images.length - 1 ? 0 : currentIndex + 1; setImageIndexes(current => ({ ...current, [painting.id]: nextIndex })) }} aria-label="Next image">›</button>
                    <div className="painting-image-counter">{(imageIndexes[painting.id] || 0) + 1} / {painting.images.length}</div>
                  </>}
                </> : <div className="painting-image-placeholder"><span>✦</span><small>ARAmane Arts</small></div>}
                <div className="painting-card-badge">{Number(painting.is_active) === 1 ? 'Available' : 'Unavailable'}</div>
                {Number(painting.is_featured) === 1 && <div className="painting-featured-badge">Featured</div>}
              </div>
              <div className="painting-card-content">
                <span className="painting-category">{painting.category_name || 'Uncategorised'}</span>
                <h2>{painting.name}</h2>
                <div className="painting-details">
                  <div><span>SIZE</span><strong>{painting.width && painting.height ? `${painting.width} × ${painting.height} in` : '—'}</strong></div>
                  <div><span>FRAME</span><strong>{painting.frame || '—'}</strong></div>
                </div>
                <div className="painting-card-footer">
                  <div className="painting-price">₹{Number(painting.discount_price || painting.price).toLocaleString('en-IN')}</div>
                  <button className="painting-edit-button" onClick={() => navigate(`/paintings/${painting.id}/edit`)}>Edit</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
