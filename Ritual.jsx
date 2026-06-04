/* Ritual.jsx — the visit, four steps */
function Ritual() {
  const steps = [
    ['01', 'Welcome', 'You are greeted, seated, and offered a moment to settle before we begin.'],
    ['02', 'Consult', 'We listen to what you need that day — shape, shade, the feeling you are after.'],
    ['03', 'Care', 'Every step is unhurried and precise, from soak to the final, flawless coat.'],
    ['04', 'Finish', 'You leave restored — hands and feet cared for, the day a little softer.'],
  ];
  return (
    <section className="ritual" id="ritual">
      <div className="wrap">
        <Reveal className="ritual-head">
          <Eyebrow center onInk>The Visit</Eyebrow>
          <h2>An hour that feels<br />like a held breath.</h2>
          <p>Treatments are shaped to enhance your natural beauty while giving you a moment to slow
            down and simply enjoy thoughtful care.</p>
        </Reveal>
        <div className="steps">
          {steps.map(([no, t, d], i) => (
            <Reveal className="step" key={no} delay={i * 90}>
              <div className="no">{no}</div>
              <h3>{t}</h3>
              <p>{d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
Object.assign(window, { Ritual });
