import { Link } from 'react-router-dom'

export default function Home() {
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

      {/* Hero */}
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
                  <div className="ara-art-placeholder">
                    <span>ARAmane Arts</span>
                    <strong>Heritage</strong>
                    <small>ART · DEVOTION · TRADITION</small>
                  </div>
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

        {/* Craft strip */}
        <section className="ara-craft-strip">
          <div className="ara-craft-item">
            <span>01</span>
            <div>
              <strong>Handcrafted</strong>
              <p>Every piece made with devotion</p>
            </div>
          </div>

          <div className="ara-craft-item">
            <span>02</span>
            <div>
              <strong>22K Gold</strong>
              <p>Traditional gold leaf craftsmanship</p>
            </div>
          </div>

          <div className="ara-craft-item">
            <span>03</span>
            <div>
              <strong>Heritage Frames</strong>
              <p>Crafted to complement each painting</p>
            </div>
          </div>

          <div className="ara-craft-item">
            <span>04</span>
            <div>
              <strong>Made to Last</strong>
              <p>Art intended for generations</p>
            </div>
          </div>
        </section>

        {/* Introduction */}
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
            <Link to="/paintings">Collection</Link>
            <Link to="/about">Our Craft</Link>
            <Link to="/track-order">Track Order</Link>
          </div>

          <div className="ara-footer-column">
            <h3>Assistance</h3>
            <Link to="/contact">Contact Us</Link>
            <Link to="/shipping">Shipping</Link>
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