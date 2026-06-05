/* Hero.jsx */
// Today's hours, keyed off the salon's local day (Eastern) so a late-night
// visitor in another time zone still sees the correct day. Sunday is 12–5.
function todayHours() {
  const day = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short' }).format(new Date());
  return day === 'Sun' ? '12pm — 5pm' : '10am — 7pm';
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-bg"></div>
      <div className="wrap hero-inner">
        <img className="hero-emblem reveal in" src="assets/logo-emblem-ink.png" alt="Nails De Maison" />
        <Reveal as="div" delay={80}>
          <div className="eyebrow center" style={{ justifyContent: 'center', marginBottom: 22 }}>
            Buford · Georgia
          </div>
        </Reveal>
        <Reveal as="h1" delay={140}>
          Where Beauty<br />Feels at <span className="it">Home</span>
        </Reveal>
        <Reveal as="p" className="hero-sub" delay={240}>
          Manicures and pedicures shaped with intention. A moment to slow down,
          cared for from the moment you arrive.
        </Reveal>
        <Reveal as="div" className="hero-cta" delay={320}>
          <Button variant="solid" icon="calendar" onClick={() => openBooking()}>Book Now</Button>
          <Button variant="outline" href="#services" icon="arrowRight">View Services</Button>
        </Reveal>
      </div>
      <div className="hero-meta">
        <span><Icon name="mapPin" /> 3264 Buford Dr</span>
        <span><Icon name="clock" /> Today · {todayHours()}</span>
        <span><Icon name="phone" /> (470) 899-8068</span>
      </div>
    </section>
  );
}
Object.assign(window, { Hero });
