import React from 'react';

const FOOTER_CSS = `
  .re-footer {
    background: #070f1e;
    border-top: 1px solid rgba(255,255,255,0.07);
    padding: 3.5rem 2rem 2rem;
    font-family: 'DM Sans', sans-serif;
  }
  .re-footer-inner { max-width: 1200px; margin: 0 auto; }

  .re-footer-top {
    display: flex; align-items: flex-start;
    justify-content: space-between;
    gap: 2.5rem; flex-wrap: wrap;
    margin-bottom: 3rem;
    padding-bottom: 2.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .re-footer-brand { flex: 0 0 auto; max-width: 240px; }
  .re-footer-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 1rem; }
  .re-footer-logo-icon {
    width: 36px; height: 36px; background: #e85d04; border-radius: 6px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .re-footer-brand-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.45rem; color: white; letter-spacing: 1px; line-height: 1;
  }
  .re-footer-brand-sub {
    font-size: 0.58rem; color: #4b5563;
    letter-spacing: 2.5px; text-transform: uppercase; margin-top: 2px;
  }
  .re-footer-tagline {
    font-size: 0.8rem; color: #374151; line-height: 1.7; margin-bottom: 1.25rem;
  }
  .re-footer-contact-item {
    display: flex; align-items: center; gap: 8px;
    font-size: 0.78rem; color: #4b5563; margin-bottom: 0.45rem;
    text-decoration: none; transition: color 0.18s;
  }
  .re-footer-contact-item:hover { color: #9ca3af; }
  .re-footer-contact-icon {
    width: 20px; height: 20px; border-radius: 4px;
    background: rgba(232,93,4,0.12);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }

  .re-footer-links { display: flex; gap: 3rem; flex-wrap: wrap; }
  .re-footer-col h4 {
    font-size: 0.68rem; color: #e85d04;
    text-transform: uppercase; letter-spacing: 2.5px;
    font-weight: 700; margin: 0 0 1rem;
  }
  .re-footer-col a {
    display: block; font-size: 0.8rem; color: #4b5563;
    text-decoration: none; margin-bottom: 0.6rem;
    transition: color 0.18s;
  }
  .re-footer-col a:hover { color: #d1d5db; }

  .re-footer-bottom {
    display: flex; align-items: center;
    justify-content: space-between;
    flex-wrap: wrap; gap: 1rem;
  }
  .re-footer-copy { font-size: 0.75rem; color: #1f2937; }
  .re-footer-status {
    display: flex; align-items: center; gap: 6px;
    font-size: 0.72rem; color: #1f2937;
    background: rgba(34,197,94,0.06);
    border: 1px solid rgba(34,197,94,0.15);
    border-radius: 20px; padding: 4px 12px;
  }
  .re-footer-status-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #22c55e; flex-shrink: 0;
    animation: re-footer-pulse 2s infinite;
  }
  @keyframes re-footer-pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }

  .re-footer-divider {
    width: 1px; height: 60px; background: rgba(255,255,255,0.06);
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    .re-footer-top { flex-direction: column; }
    .re-footer-links { gap: 2rem; }
    .re-footer-divider { display: none; }
  }
  @media (max-width: 480px) {
    .re-footer { padding: 2.5rem 1.25rem 1.5rem; }
  }
`;

let footerCssInjected = false;

const Footer = () => {
  if (!footerCssInjected) {
    const s = document.createElement('style');
    s.textContent = FOOTER_CSS;
    document.head.appendChild(s);
    footerCssInjected = true;
  }

  return (
    <footer className="re-footer">
      <div className="re-footer-inner">
        <div className="re-footer-top">

          {/* BRAND + CONTACT */}
          <div className="re-footer-brand">
            <div className="re-footer-logo">
              <div className="re-footer-logo-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
                  <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                </svg>
              </div>
              <div>
                <div className="re-footer-brand-name">
                  Rahul <span style={{ color: '#e85d04' }}>Enterprise</span>
                </div>
                <div className="re-footer-brand-sub">Cargo &amp; Logistics</div>
              </div>
            </div>

            <p className="re-footer-tagline">
              GE-standard logistics network spanning 250+ cities — built from Kolkata, connecting every corner of India.
            </p>

            <a href="tel:+919831499345" className="re-footer-contact-item">
              <div className="re-footer-contact-icon">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="#e85d04">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
              </div>
              +91 98314 99345
            </a>
            <a href="tel:+918521929774" className="re-footer-contact-item">
              <div className="re-footer-contact-icon">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="#e85d04">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
              </div>
              +91 85219 29774
            </a>
            <a href="tel:+919163189573" className="re-footer-contact-item">
              <div className="re-footer-contact-icon">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="#e85d04">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
              </div>
              +91 9163189573
            </a>
            <a href="tel:+918777432963" className="re-footer-contact-item">
              <div className="re-footer-contact-icon">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="#e85d04">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
              </div>
              +91 8777432963
            </a>
            <a href="mailto:info@rahulenterprise.in" className="re-footer-contact-item">
              <div className="re-footer-contact-icon">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="#e85d04">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </div>
              rahulenterprise123@gmail.com
            </a>
            <div className="re-footer-contact-item" style={{ cursor: 'default' }}>
              <div className="re-footer-contact-icon">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="#e85d04">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              6,Porbazar Lane,Kolkata, West Bengal 700 020 — India
            </div>
          </div>

          <div className="re-footer-divider" />

          {/* LINKS */}
          <div className="re-footer-links">
            <div className="re-footer-col">
              <h4>Navigate</h4>
              
              <a href="/#services">Services</a>
              <a href="/#why">Why Us</a>
            </div>
            <div className="re-footer-col">
              <h4>Quick Links</h4>
            <a href="/track">Track Shipment</a>
              <a href="/#coverage">Coverage Map</a>
              <a href="/#tracking">Live Tracker</a>
            </div>
            <div className="re-footer-col">
              <h4>Hours</h4>
              <a href="/#contact" style={{ color: '#22c55e', pointerEvents: 'none', cursor: 'default' }}>● Open Now</a>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#4b5563', marginBottom: '0.6rem' }}>Mon – Sun</span>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.6rem' }}>24 Hours Open</span>
              <a href="/#contact" style={{ color: '#e85d04', fontSize: '0.8rem', marginTop: '0.5rem', display: 'inline-block' }}></a>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="re-footer-bottom">
          <div className="re-footer-copy">© 2026 Rahul Enterprise. All rights reserved.</div>
          <div className="re-footer-status">
            <div className="re-footer-status-dot" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;