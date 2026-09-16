import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiUrl } from '../config/api'

export default function Home() {
  const [featured, setFeatured] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch(apiUrl('paintings/list.php'))
      .then(response => response.json())
      .then(data => {
        if (cancelled || !data.success) return
        const painting = (data.paintings || []).find(item => Number(item.is_featured) === 1 && Number(item.is_active) === 1)
        if (painting) setFeatured(painting)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const getImageUrl = url => {
    if (!url) return ''
    if (/^https?:\/\//i.test(url)) return url
    return new URL(url.replace(/^\/+/, '/'), `${new URL(apiUrl('')).origin}/`).href
  }

  const featuredImage = featured?.images?.find(image => Number(image.is_primary) === 1)?.image_url || featured?.images?.[0]?.image_url || featured?.image_url

  return (
    <>
      <main>
        <section className="ara-hero">
          <div className="ara-hero-inner">
            <div className="ara-hero-copy">
              <div className="ara-eyebrow">
                <span></span>
                TIMELESS · SACRED · HANDCRAFTED
                <span></span>
              </div>

              <h1>
                Art that carries
                <em> generations.</em>
              </h1>

              <p>
                Discover handcrafted Indian heritage paintings,
                created with devotion and preserved for generations
                to come.
              </p>

              <div className="ara-hero-actions">
                <Link to="/paintings" className="ara-btn ara-btn-primary">
                  Explore the Collection
                  <span>✦</span>
                </Link>
                <Link to="/about" className="ara-btn ara-btn-secondary">
                  Discover Our Craft
                </Link>
              </div>
            </div>

            <div className="ara-hero-art">
              <div className="ara-art-frame">
                <div className="ara-art-inner">
                  {featuredImage ? (
                    <Link to={`/paintings/${featured.id}`} className="ara-featured-art-link" aria-label={`View featured painting: ${featured.name}`}>
                      <img className="ara-featured-art-image" src={getImageUrl(featuredImage)} alt={featured.name} />
                      <span className="ara-featured-label">Featured</span>
                    </Link>
                  ) : (
                    <div className="ara-art-placeholder">
                      <span>ARAmane Arts</span>
                      <strong>Heritage</strong>
                      <small>ART · DEVOTION · TRADITION</small>
                    </div>
                  )}
                </div>

                <div className="ara-corner ara-corner-tl"></div>
                <div className="ara-corner ara-corner-tr"></div>
                <div className="ara-corner ara-corner-bl"></div>
                <div className="ara-corner ara-corner-br"></div>

                <div className="ara-stamp">
                  <span>✦</span>
                  <strong>22K</strong>
                  <small>GOLD</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="ara-craft-strip">
          <div className="ara-craft-item"><span>01</span><div><strong>Handcrafted</strong><p>Every piece made with devotion</p></div></div>
          <div className="ara-craft-item"><span>02</span><div><strong>22K Gold</strong><p>Traditional gold leaf craftsmanship</p></div></div>
          <div className="ara-craft-item"><span>03</span><div><strong>Heritage Frames</strong><p>Crafted to complement each painting</p></div></div>
          <div className="ara-craft-item"><span>04</span><div><strong>Made to Last</strong><p>Art intended for generations</p></div></div>
        </section>

        <section className="ara-introduction">
          <div className="ara-section-heading">
            <span>THE ARAmane COLLECTION</span>
            <h2>Stories painted in gold.</h2>
            <p>
              Explore sacred figures, timeless traditions and
              masterful craftsmanship through our curated collection
              of Indian heritage paintings.
            </p>
          </div>
          <Link to="/paintings" className="ara-text-link">
            View the collection <span>→</span>
          </Link>
        </section>
      </main>
    </>
  )
}
