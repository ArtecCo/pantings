import { useState } from 'react'

const samplePaintings = []

export default function Paintings() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')

  const filteredPaintings = samplePaintings.filter((painting) => {
    const matchesSearch =
      painting.name.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      status === 'all' || painting.status === status

    const matchesCategory =
      category === 'all' || painting.category === category

    return matchesSearch && matchesStatus && matchesCategory
  })

  return (
    <div className="paintings-page">

      <div className="page-header">
        <div>
          <span className="eyebrow">ART COLLECTION</span>
          <h1>Paintings</h1>
          <p>
            Manage the paintings available through ARAmane Arts.
          </p>
        </div>

        <button className="gold-outline-button">
          + Add Painting
        </button>
      </div>

      <div className="gold-rule" />

      <div className="painting-toolbar">

        <div className="painting-search">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search paintings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="Tanjore">Tanjore</option>
          <option value="Mysore">Mysore</option>
          <option value="Traditional">Traditional</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>

      </div>

      <div className="paintings-summary">
        <span>
          {filteredPaintings.length} paintings
        </span>

        <span className="summary-separator">·</span>

        <span>
          Heritage Collection
        </span>
      </div>

      {filteredPaintings.length === 0 ? (

        <div className="heritage-card paintings-empty">

          <div className="painting-empty-symbol">
            ✦
          </div>

          <h2>No paintings yet</h2>

          <p>
            Your collection is currently empty.
            Add your first painting to begin building
            the ARAmane Arts catalogue.
          </p>

          <button className="gold-outline-button">
            + Add First Painting
          </button>

        </div>

      ) : (

        <div className="paintings-grid">

          {filteredPaintings.map((painting) => (

            <article
              className="heritage-card painting-card"
              key={painting.id}
            >

              <div className="painting-image">
                {painting.image ? (
                  <img
                    src={painting.image}
                    alt={painting.name}
                  />
                ) : (
                  <div className="painting-image-placeholder">
                    ✦
                  </div>
                )}

                <span className="gold-badge">
                  {painting.category}
                </span>
              </div>

              <div className="painting-details">

                <div className="painting-category">
                  {painting.category}
                </div>

                <h2>{painting.name}</h2>

                <div className="painting-meta">
                  <span>{painting.dimensions}</span>
                  <span>{painting.frame}</span>
                </div>

                <div className="painting-footer">

                  <strong>
                    ₹{painting.price.toLocaleString('en-IN')}
                  </strong>

                  <span
                    className={`painting-status ${painting.status}`}
                  >
                    {painting.status}
                  </span>

                </div>

                <div className="painting-actions">
                  <button>Edit</button>
                  <button>Delete</button>
                </div>

              </div>

            </article>

          ))}

        </div>

      )}

    </div>
  )
}