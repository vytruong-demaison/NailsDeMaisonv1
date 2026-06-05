/* Closing.jsx — quote, booking, footer */
function Quote() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = REVIEWS.length;
  const go = (d) => setI((p) => (p + d + n) % n);

  // Auto-advance, paused on hover/focus and when the guest prefers reduced motion.
  useEffect(() => {
    if (paused || n <= 1) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setI((p) => (p + 1) % n), 7000);
    return () => clearInterval(t);
  }, [paused, n]);

  // Touch swipe on mobile.
  const touchX = useRef(null);
  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  return (
    <section className="quote" id="reviews"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
      <div className="wrap-tight">
        <Reveal>
          <div className="mark">“</div>

          <div className="rev-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            {REVIEWS.map((r, k) => (
              <figure key={k} className={`rev-card ${k === i ? 'on' : ''}`} aria-hidden={k === i ? undefined : true}>
                <div className="stars" aria-label={`${r.stars} out of 5 stars`}>
                  {Array.from({ length: r.stars }).map((_, s) => <Icon key={s} name="star" star />)}
                </div>
                <blockquote>{r.text}</blockquote>
                <figcaption className="who">{r.name}</figcaption>
              </figure>
            ))}
          </div>

          <a className="rev-source" href={NDM.google} target="_blank" rel="noreferrer">
            <Icon name="google" /><span>Reviews from Google</span>
          </a>

          <div className="rev-ctrl">
            <button className="rev-arrow" onClick={() => go(-1)} aria-label="Previous review"><Icon name="chevronLeft" /></button>
            <div className="rev-dots">
              {REVIEWS.map((_, k) => (
                <button key={k} className={`rev-dot ${k === i ? 'on' : ''}`}
                  aria-label={`Show review ${k + 1}`} aria-current={k === i} onClick={() => setI(k)} />
              ))}
            </div>
            <button className="rev-arrow" onClick={() => go(1)} aria-label="Next review"><Icon name="chevronRight" /></button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Booking() {
  return (
    <section className="booking" id="booking">
      <div className="wrap booking-grid">
        <div>
          <Reveal><Eyebrow>Visit Us</Eyebrow></Reveal>
          <Reveal delay={70}><h2>We would love<br />to have you.</h2></Reveal>
          <Reveal delay={130}>
            <p className="booking-lead ndm-lead">
              Reserve online in a few taps. Pick your service and time and you'll get a text
              confirmation. Walk-ins are always welcome whenever a chair is open.
            </p>
          </Reveal>
          <Reveal delay={180}>
            <div className="info-list">
              <div className="info-row">
                <Icon name="mapPin" />
                <div><div className="lbl">Find us</div><div className="val">{NDM.address}</div></div>
              </div>
              <div className="info-row">
                <Icon name="phone" />
                <div><div className="lbl">Call to book</div><div className="val"><a href={NDM.phoneHref}>{NDM.phone}</a></div></div>
              </div>
              <div className="info-row">
                <Icon name="clock" />
                <div><div className="lbl">Hours</div>
                  <div className="val">Mon–Sat 10am–7pm</div>
                  <div className="val" style={{ fontSize: '1rem', color: 'var(--fg2)' }}>Sun 12pm–5pm</div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal className="book-card" delay={120}>
          <div className="bg"></div>
          <Eyebrow onInk>Reservations</Eyebrow>
          <h3>Book your visit</h3>
          <p>Choose your service and a time that suits you. You'll get a confirmation by text.</p>
          <Button variant="cream" icon="calendar" onClick={() => openBooking()}>Book online</Button>
          <div className="hrs">
            {NDM.hours.map(([d, h]) => <div key={d}><span>{d}</span><span>{h}</span></div>)}
          </div>
          <p style={{ margin: '20px 0 0', fontSize: '0.9rem' }}>
            Prefer to call? <a href={NDM.phoneHref} style={{ color: 'var(--ivory)', textDecoration: 'underline', textUnderlineOffset: '4px' }}>{NDM.phone}</a>
          </p>
        </Reveal>
      </div>

      <div className="wrap">
        <Reveal className="map-embed" delay={60}>
          <iframe title="Map to Nails De Maison" src={NDM.mapSrc} loading="lazy"></iframe>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="wrap">
        <div className="footer-top">
          <div>
            <a className="brand" href="#top">
              <img src="assets/logo-emblem-cream.png" alt="Nails De Maison" />
              <span className="bn">NAILS DE MAISON</span>
            </a>
            <p className="footer-blurb">
            A premier nail salon in Buford, Georgia, where every service is delivered with care and intention.
            </p>
            <div className="footer-socials">
              <a href={NDM.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Icon name="instagram" /></a>
              <a href={NDM.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><Icon name="facebook" /></a>
              <a href={NDM.google} target="_blank" rel="noreferrer" aria-label="Google"><Icon name="google" /></a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Explore</h4>
            <a href="#about">The House</a>
            <a href="#services">Services</a>
            <a href="#ritual">The Visit</a>
            <a href="#gallery">Our Work</a>
            <a href="#booking">Visit Us</a>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <a href={NDM.phoneHref}>{NDM.phone}</a>
            <a href={`mailto:${NDM.email}`}>Email us</a>
            <p>{NDM.address}</p>
            <p>Mon–Sat 10am–7pm · Sun 12pm–5pm</p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Nails De Maison. All rights reserved.</span>
          <span>Shaped with intention.</span>
        </div>
      </div>
    </footer>
  );
}
Object.assign(window, { Quote, Booking, Footer });
