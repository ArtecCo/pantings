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
            <style>{`
                .ara-menu-toggle{display:none!important;width:42px;height:42px;padding:9px;border:1px solid rgba(91,18,23,.22);border-radius:50%;background:transparent;cursor:pointer;flex-direction:column;justify-content:center;gap:4px;align-items:center}
                .ara-menu-toggle span{display:block;width:18px;height:1.5px;background:#5b1217;transition:transform .2s ease,opacity .2s ease}
                .ara-menu-toggle.active span:nth-child(1){transform:translateY(5.5px) rotate(45deg)}
                .ara-menu-toggle.active span:nth-child(2){opacity:0}
                .ara-menu-toggle.active span:nth-child(3){transform:translateY(-5.5px) rotate(-45deg)}
                .ara-mobile-menu{position:fixed;inset:82px 0 0;z-index:9998;display:flex}
                .ara-mobile-menu-backdrop{position:absolute;inset:0;border:0;background:rgba(44,24,16,.48);backdrop-filter:blur(4px);cursor:pointer}
                .ara-mobile-menu-panel{position:relative;width:min(370px,88vw);height:100%;padding:34px 28px;background:#fdfbf7;box-shadow:18px 0 45px rgba(44,24,16,.2);display:flex;flex-direction:column;gap:2px;overflow-y:auto}
                .ara-mobile-menu-eyebrow{margin-bottom:14px;color:#d4af37;font-size:9px;letter-spacing:.24em;text-transform:uppercase}
                .ara-mobile-menu-panel a{display:flex;align-items:center;justify-content:space-between;padding:17px 4px;border-bottom:1px solid rgba(91,18,23,.12);color:#5b1217;font-family:'Cormorant Garamond',serif;font-size:27px}
                .ara-mobile-menu-panel a span{color:#d4af37;font-family:'DM Sans',sans-serif;font-size:18px;transition:transform .2s ease}
                @media (max-width:900px){.ara-nav{display:none!important}.ara-menu-toggle{display:flex!important}.ara-account{display:none!important}.ara-header-actions{min-width:auto;gap:9px}}
                @media (min-width:901px){.ara-menu-toggle{display:none!important}.ara-mobile-menu{display:none!important}}
                @media (max-width:600px){.ara-header-inner{width:calc(100% - 24px);min-height:68px;gap:10px}.ara-brand{min-width:0;max-width:calc(100% - 110px)}.ara-brand-name{font-size:23px;white-space:nowrap}.ara-cart{padding:8px 10px;font-size:11px}.ara-cart-count{width:18px;height:18px;font-size:9px}.ara-mobile-menu{inset:68px 0 0}.ara-mobile-menu-panel{width:min(340px,90vw);padding:26px 22px}.ara-mobile-menu-panel a{font-size:24px}.ara-client{max-width:100%;overflow-x:hidden}.ara-client main{max-width:100%;overflow-x:hidden}}
            `}</style>
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
                        <button type="button" className={`ara-menu-toggle${menuOpen ? ' active' : ''}`} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)}><span /><span /><span /></button>
                    </div>
                </div>
            </header>
            {menuOpen && <div className="ara-mobile-menu" role="dialog" aria-modal="true" aria-label="Mobile navigation"><button type="button" className="ara-mobile-menu-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} /><nav className="ara-mobile-menu-panel" aria-label="Mobile navigation links"><div className="ara-mobile-menu-eyebrow">Explore ARAmane Arts</div><Link to="/">Home <span>→</span></Link><Link to="/paintings">Collection <span>→</span></Link><Link to="/about">Our Craft <span>→</span></Link><Link to="/cart">Cart <span>→</span></Link><Link to="/account">Account <span>→</span></Link></nav></div>}
            <main><div className="ara-page-stage" key={location.pathname}>{children}</div></main>
            <footer className="ara-footer"><div className="ara-footer-inner"><div className="ara-footer-brand"><span>THE HOUSE OF</span><strong>ARAmane Arts</strong><p>Preserving India's sacred artistic traditions, one handcrafted painting at a time.</p></div><div className="ara-footer-column"><h3>Explore</h3><Link to="/paintings">Collection</Link><Link to="/about">Our Craft</Link></div><div className="ara-footer-column"><h3>Assistance</h3><Link to="/contact">Contact Us</Link><Link to="/shipping">Shipping</Link><Link to="/faq">FAQs</Link></div></div><div className="ara-footer-bottom"><span>© {new Date().getFullYear()} ARAmane Arts</span><span>Crafted with reverence for Indian heritage</span></div></footer>
        </div>
    );
}
