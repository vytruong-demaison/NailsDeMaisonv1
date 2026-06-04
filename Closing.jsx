/* Closing.jsx — quote, booking, footer */
function Quote() {
  return (
    <section className="quote">
      <div className="wrap-tight">
        <Reveal>
          <div className="mark">“</div>
          <blockquote>Like being welcomed into a house that values ease and comfort.</blockquote>
          <div className="stars" aria-label="Five stars">
            <Icon name="star" star /><Icon name="star" star /><Icon name="star" star /><Icon name="star" star /><Icon name="star" star />
          </div>
          <div className="who">A Nails De Maison guest</div>
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
              Reserve online in a few taps — pick your service and time and you'll get a text
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
                  <div className="val">Mon–Sat 10a–7p</div>
                  <div className="val" style={{ fontSize: '1rem', color: 'var(--fg2)' }}>Sun 12p–5p</div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal className="book-card" delay={120}>
          <div className="bg"></div>
          <Eyebrow onInk>Reservations</Eyebrow>
          <h3>Book your visit</h3>
          <p>Choose your service and a time that suits you — you'll get a confirmation by text.</p>
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
              A French-inspired house of nail care in Buford, Georgia — where every visit is
              shaped with intention.
            </p>
            <div className="footer-socials">
              <a href={NDM.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Icon name="instagram" /></a>
              <a href={NDM.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><Icon name="facebook" /></a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Explore</h4>
            <a href="#about">The House</a>
            <a href="#services">Services</a>
            <a href="#ritual">The Visit</a>
            <a href="#gallery">Shades</a>
            <a href="#booking">Visit Us</a>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <a href={NDM.phoneHref}>{NDM.phone}</a>
            <a href={`mailto:${NDM.email}`}>Email us</a>
            <p>{NDM.address}</p>
            <p>Mon–Sat 10a–7p · Sun 12p–5p</p>
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
