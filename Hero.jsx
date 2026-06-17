/* Hero.jsx */
// Today's hours, keyed off the salon's local day (Eastern) so a late-night
// visitor in another time zone still sees the correct day. Sunday is 12–5.
function todayHours() {
  const day = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short' }).format(new Date());
  return day === 'Sun' ? '12pm — 5pm' : '10am — 7pm';
}

// Honest, zero-maintenance urgency: the next Sunday's 20% deal. Auto-updates to
// the upcoming Sunday's date (salon time) so it can never go stale; on a Sunday
// it reads "Today only." No fake countdown — a real, recurring deadline.
function sundayUrgency() {
  const now = new Date();
  const idx = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short' }).format(now)
  ];
  if (idx === 0) return 'Today only — 20% off every service';
  const target = new Date(now.getTime() + (7 - idx) * 86400000);
  const md = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'long', day: 'numeric' }).format(target);
  return `This Sunday, ${md} — 20% off every service`;
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-bg"></div>
      <div className="wrap hero-inner">
        <img className="hero-emblem reveal in" src="assets/logo-emblem-ink.png" alt="Nails De Maison" />
        <Reveal as="div" delay={80}>
          <div className="eyebrow center" style={{ justifyContent: 'center', marginBottom: 16 }}>
            Buford · Georgia
          </div>
        </Reveal>

        {/* 1 — bold offer headline */}
        <Reveal as="h1" className="hero-offer" delay={140}>
          Summer Sale — <span className="pct">10% Off</span><br />When You Book Online
        </Reveal>

        {/* 2 — brand tagline, now the supporting line */}
        <Reveal as="p" className="hero-tagline" delay={210}>
          Where Beauty Feels at <span className="it">Home</span>
        </Reveal>

        {/* 3 — the existing one-sentence subhead */}
        <Reveal as="p" className="hero-sub" delay={280}>
          Manicures and pedicures shaped with intention. A moment to slow down,
          cared for from the moment you arrive.
        </Reveal>

        {/* 4 — primary CTA: the 10% OFF badge fused to the button so offer + action read as one unit */}
        <Reveal as="div" className="hero-cta-wrap" delay={360}>
          <div className="hero-urgency">{sundayUrgency()}</div>
          <button className="hero-book" onClick={() => openBooking({ source: 'hero' })}>
            <span className="hero-book-badge">10% Off</span>
            <span className="hero-book-label"><Icon name="calendar" className="ic" /> Book Now &amp; Save 10%</span>
          </button>
          <div className="hero-microcopy">Takes 30 seconds · No account needed · Pay at the salon</div>
          <div className="hero-secondary">
            <Button variant="outline" href="#services" icon="arrowRight">View Services</Button>
            <a className="btn btn-outline hero-call" href={NDM.phoneHref}>Call to Book<Icon name="phone" className="ic" /></a>
          </div>
        </Reveal>

        {/* trust signal — real Google rating, opens the Google profile */}
        <Reveal as="div" className="hero-trust" delay={440}>
          <a className="hero-rating" href={NDM.google} target="_blank" rel="noreferrer"
            aria-label={`Rated ${NDM.googleRating} out of 5 on Google from ${NDM.googleReviews} reviews`}>
            <span className="stars" aria-hidden="true">★★★★★</span>
            <span className="rt">Rated <strong>{NDM.googleRating}</strong> on Google</span>
            <span className="ct">· {NDM.googleReviews} reviews</span>
          </a>
        </Reveal>
      </div>
      <a className="hero-scroll" href="#about" aria-label="Scroll to explore">
        <span className="lbl">Explore</span>
        <Icon name="chevronDown" className="ic" />
      </a>
      <div className="hero-meta">
        <span><Icon name="mapPin" /> 3264 Buford Dr</span>
        <span><Icon name="clock" /> Today · {todayHours()}</span>
        <span><Icon name="phone" /> (470) 899-8068</span>
      </div>
    </section>
  );
}

/* Sunday Funday — the salon's biggest standing offer (20% off every Sunday),
   surfaced as its own callout so it's as visible on the page as it is in the ad.
   The booking modal applies 20% automatically for Sunday dates. */
function SundayFunday() {
  return (
    <section className="sunday" id="sunday" aria-label="Sunday Funday — 20% off every Sunday">
      <div className="wrap sunday-inner">
        <Reveal className="sunday-badge">
          <span className="pc">20%</span><span className="off">Off</span>
        </Reveal>
        <Reveal className="sunday-copy" delay={80}>
          <div className="sunday-kicker">Sunday Funday</div>
          <h2 className="sunday-ttl">20% off every service, every Sunday</h2>
          <p className="sunday-sub">
            Book any Sunday visit online and save 20% — double the everyday online
            discount, applied at the salon.
          </p>
        </Reveal>
        <Reveal className="sunday-cta" delay={140}>
          <Button variant="solid" icon="calendar" onClick={() => openBooking({ source: 'sunday' })}>Book a Sunday</Button>
        </Reveal>
      </div>
    </section>
  );
}
Object.assign(window, { Hero, SundayFunday });
