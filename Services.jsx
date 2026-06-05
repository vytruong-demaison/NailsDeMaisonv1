/* Services.jsx — letterpress menu with tabs */
function ServiceColumn({ data }) {
  return (
    <div className="svc-col">
      <h3>{data.label}<span className="ct">{data.count}</span></h3>
      {data.rows.map((r) => (
        <div className="svc-row" key={r.name} onClick={() => openBooking({ service: r.name })}>
          <div className="sr-text">
            <div className="sr-name">{r.name}</div>
            <div className="sr-desc">{r.desc}</div>
          </div>
          <span className="sr-go" aria-hidden="true"><Icon name="arrowRight" /></span>
        </div>
      ))}
    </div>
  );
}

function Services() {
  const [tab, setTab] = useState('all');
  const showMani = tab === 'all' || tab === 'manicure';
  const showPedi = tab === 'all' || tab === 'pedicure';
  return (
    <section className="services" id="services">
      <div className="wrap-tight">
        <Reveal className="services-head">
          <Eyebrow center>The Menu</Eyebrow>
          <h2>Considered care,<br />priced with honesty.</h2>
          <p className="ndm-lead">
            Each service is designed with a clear focus on comfort, balance, and the small touches
            that elevate your experience.
          </p>
        </Reveal>

        <Reveal className="svc-tabs" delay={80}>
          {[['all', 'All'], ['manicure', 'Manicure'], ['pedicure', 'Pedicure']].map(([k, l]) => (
            <button key={k} className={`svc-tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </Reveal>

        <Reveal className={`svc-cols ${tab === 'all' ? 'cols-2' : 'cols-1'}`} delay={120}>
          {showMani && <ServiceColumn data={SERVICES.manicure} />}
          {showPedi && <ServiceColumn data={SERVICES.pedicure} />}
        </Reveal>

        <Reveal className="services-note" delay={160}>
          <span className="ndm-small">Gel extras, soak off, and nail art available. Ask your technician.</span>
          <Button variant="solid" icon="calendar" onClick={() => openBooking()}>Reserve your visit</Button>
        </Reveal>
      </div>
    </section>
  );
}
Object.assign(window, { Services });
