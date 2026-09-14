import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
    const location = useLocation();

    return (
        <div className="ara-client">
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
                        <Link to="/cart" className="ara-cart">
                            <span>Cart</span>
                            <span className="ara-cart-count">0</span>
                        </Link>

                        <Link to="/account" className="ara-account">
                            Account
                        </Link>
                    </div>
                </div>
            </header>

            <main>
                <div className="ara-page-stage" key={location.pathname}>{children}</div>
            </main>

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
    );
}
