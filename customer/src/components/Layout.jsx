import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => setMenuOpen(false), [location.pathname]);
    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [menuOpen]);

    return (
        <div className="ara-client">
            <header className="ara-header">
                <div className="ara-header-inner">
                    <Link to="/" className="ara-brand" aria-label="ARAmane Arts home">
                        <span className="ara-brand-small">THE HOUSE OF</span>
                        <span className="ara-brand-name">ARAmane Arts</span>
                    </Link>
                    <nav className="ara-nav" aria-label="Main navigation">
                        <Link to="/">Home</Link>
                        <Link to="/paintings">Collection</Link>
                        <Link to="/about">Our Craft</Link>
                    </nav>
                    <div className="ara-header-actions">
                        <Link to="/cart" className="ara-cart"><span>Cart</span><span className="ara-cart-count">0</span></Link>
                        <Link to="/account" className="ara-account">Account</Link>
                        <button type="button" className={`ara-menu-toggle${menuOpen ? ' active' : ''}`} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)}>
                            <span /><span /><span />
                        </button>
                    </div>
                </div>
            </header>
            {menuOpen && (
                <div className="ara-mobile-menu" role="dialog" aria-label="Mobile navigation">
                    <button type="button" className="ara-mobile-menu-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
                    <nav className="ara-mobile-menu-panel" aria-label="Mobile navigation links">
                        <div className="ara-mobile-menu-eyebrow">Explore ARAmane Arts</div>
                        <Link to="/">Home <span>→</span></Link>
                        <Link to="/paintings">Collection <span>→</span></Link>
                        <Link to="/about">Our Craft <span>→</span></Link>
                        <Link to="/cart">Cart <span>→</span></Link>
                        <Link to="/account">Account <span>→</span></Link>
                    </nav>
                </div>
            )}
            <main><div className="ara-page-stage" key={location.pathname}>{children}</div></main>
            <footer className="ara-footer">
                <div className="ara-footer-inner">
                    <div className="ara-footer-brand"><span>THE HOUSE OF</span><strong>ARAmane Arts</strong><p>Preserving India's sacred artistic traditions, one handcrafted painting at a time.</p></div>
                    <div className="ara-footer-column"><h3>Explore</h3><Link to="/paintings">Collection</Link><Link to="/about">Our Craft</Link></div>
                    <div className="ara-footer-column"><h3>Assistance</h3><Link to="/contact">Contact Us</Link><Link to="/shipping">Shipping</Link><Link to="/faq">FAQs</Link></div>
                </div>
                <div className="ara-footer-bottom"><span>© {new Date().getFullYear()} ARAmane Arts</span><span>Crafted with reverence for Indian heritage</span></div>
            </footer>
        </div>
    );
}
