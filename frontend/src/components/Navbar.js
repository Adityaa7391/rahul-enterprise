import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logoImg from './logo.png'; // <-- Yahan galti thi, ab bilkul sahi hai

const NAV_CSS = `
  .re-nav { background: #0a1628; position: sticky; top: 0; z-index: 1000; border-bottom: 3px solid #e85d04; font-family: 'DM Sans', sans-serif; }
  .re-nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 2rem; display: flex; align-items: center; justify-content: space-between; height: 68px; gap: 1rem; }

  .re-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; flex-shrink: 0; }
  
  .re-logo-icon { 
    width: 44px; 
    height: 44px; 
    border-radius: 50%; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    flex-shrink: 0; 
    overflow: hidden; 
    border: 2px solid #e85d04; 
  }
  .re-logo-icon img { width: 100%; height: 100%; object-fit: cover; }

  .re-logo-name { color: white; font-family: 'Bebas Neue', sans-serif; font-size: 1.55rem; letter-spacing: 1px; line-height: 1; }
  .re-logo-sub { font-size: 0.6rem; color: #9ca3af; letter-spacing: 2.5px; text-transform: uppercase; font-weight: 400; margin-top: 1px; }

  .re-nav-links { display: flex; align-items: center; gap: 0; list-style: none; margin: 0; padding: 0; }
  .re-nav-links li { position: relative; }
  .re-nav-links a, .re-nav-links button {
    display: flex; align-items: center; gap: 5px;
    color: #9ca3af; text-decoration: none;
    font-size: 0.82rem; font-weight: 500; letter-spacing: 0.3px;
    padding: 0.45rem 0.85rem; border-radius: 5px;
    border: none; background: transparent; cursor: pointer;
    transition: color 0.18s, background 0.18s; white-space: nowrap;
  }
  .re-nav-links a:hover, .re-nav-links button:hover { color: white; background: rgba(255,255,255,0.07); }
  .re-nav-links a.active { color: white; }
  .re-nav-links a.active::after {
    content: ''; position: absolute; bottom: -3px; left: 50%; transform: translateX(-50%);
    width: 18px; height: 3px; background: #e85d04; border-radius: 2px;
  }

  .re-nav-track {
    display: flex; align-items: center; gap: 6px;
    color: white !important; background: rgba(232,93,4,0.15) !important;
    border: 1px solid rgba(232,93,4,0.35) !important;
    border-radius: 5px; padding: 0.38rem 0.9rem !important;
    font-size: 0.82rem !important; font-weight: 600 !important;
    text-decoration: none; transition: all 0.18s; white-space: nowrap;
  }
  .re-nav-track:hover { background: rgba(232,93,4,0.28) !important; border-color: rgba(232,93,4,0.6) !important; }
  .re-nav-track-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; animation: re-pulse 1.6s infinite; flex-shrink: 0; }
  @keyframes re-pulse { 0%,100%{opacity:1;} 50%{opacity:0.35;} }

  .re-nav-right { display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0; }
  .re-btn-quote { background: #e85d04; color: white; padding: 0.42rem 1.1rem; border-radius: 5px; font-size: 0.82rem; font-weight: 700; text-decoration: none; transition: all 0.18s; letter-spacing: 0.2px; }
  .re-btn-quote:hover { background: #f48c06; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(232,93,4,0.4); }

  .re-hamburger { display: none; flex-direction: column; gap: 5px; cursor: pointer; padding: 4px; background: transparent; border: none; }
  .re-hamburger span { display: block; width: 22px; height: 2px; background: white; border-radius: 2px; transition: 0.3s; }
  .re-hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
  .re-hamburger.open span:nth-child(2) { opacity: 0; }
  .re-hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

  .re-mobile-menu {
    display: none; flex-direction: column;
    background: #0d1f3c; border-top: 1px solid rgba(255,255,255,0.08);
    padding: 1rem 1.5rem 1.5rem;
    position: absolute; top: 68px; left: 0; right: 0;
    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    z-index: 999;
  }
  .re-mobile-menu.open { display: flex; }
  .re-mobile-menu a {
    color: #9ca3af; text-decoration: none; font-size: 0.9rem; font-weight: 500;
    padding: 0.7rem 0; border-bottom: 1px solid rgba(255,255,255,0.06);
    background: transparent; border-left: none; border-right: none; border-top: none;
    cursor: pointer; text-align: left; font-family: inherit; display: flex; align-items: center; gap: 8px;
  }
  .re-mobile-menu a:hover { color: white; }
  .re-mobile-menu .re-mobile-quote {
    margin-top: 1rem; background: #e85d04; color: white !important;
    border-radius: 6px; padding: 0.75rem 1rem !important;
    justify-content: center; font-weight: 700 !important; border: none !important;
  }

  @media (max-width: 900px) {
    .re-nav-links { display: none !important; }
    .re-hamburger { display: flex; }
  }
  @media (max-width: 600px) {
    .re-nav-inner { padding: 0 1rem; }
    .re-logo-sub { display: none; }
  }
`;

let navCssInjected = false;
function injectNavCSS() {
  if (navCssInjected) return;
  const style = document.createElement('style');
  style.textContent = NAV_CSS;
  document.head.appendChild(style);
  navCssInjected = true;
}

const navItems = [
  { label: 'Home',      href: '/' },
  { label: 'Services',  href: '/#services' },
  { label: 'Why Us',    href: '/#why' },
  { label: 'Coverage',  href: '/#coverage' },
  { label: 'Contact',   href: '/#contact' },
];

const Navbar = () => {
  injectNavCSS();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [location]);

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/' && !location.hash;
    return location.hash === href.replace('/', '') || location.pathname === href;
  };

  return (
    <nav className="re-nav" style={{ position: 'sticky' }}>
      <div className="re-nav-inner">

        {/* LOGO */}
        <Link to="/" className="re-logo">
          <div className="re-logo-icon">
            <img src={logoImg} alt="Rahul Enterprise Logo" />
          </div>
          <div>
            <div className="re-logo-name">Rahul Enterprise</div>
            <div className="re-logo-sub">Courier &amp; Logistics</div>
          </div>
        </Link>

        {/* DESKTOP NAV */}
        <ul className="re-nav-links">
          <li>
            <a href="/#tracking" className="re-nav-track">
              <span className="re-nav-track-dot" />
              Track Shipment
            </a>
          </li>
          {navItems.map(({ label, href }) => (
            <li key={label}>
              <a href={href} className={isActive(href) ? 'active' : ''}>{label}</a>
            </li>
          ))}
        </ul>

        {/* RIGHT */}
        <div className="re-nav-right">
          <a href="/#contact" className="re-btn-quote">Get Quote</a>
        </div>

        {/* HAMBURGER */}
        <button
          className={`re-hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* MOBILE MENU */}
      <div className={`re-mobile-menu ${menuOpen ? 'open' : ''}`}>
        <a href="/#tracking">
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 're-pulse 1.6s infinite', display: 'inline-block' }} />
          Track Shipment
        </a>
        {navItems.map(({ label, href }) => (
          <a key={label} href={href}>{label}</a>
        ))}
        <a href="/#contact" className="re-mobile-quote">Get Quote →</a>
      </div>
    </nav>
  );
};

export default Navbar;