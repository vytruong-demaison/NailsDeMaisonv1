/* About.jsx — marquee strip + the house story */
function Strip() {
  const words = ['Manicure', 'Pedicure', 'Gel', 'Chamomile Spa', 'Signature Care', 'Volcano Spa', 'Nail Art'];
  const run = [...words, ...words];
  return (
    <div className="strip" aria-hidden="true">
      <div className="strip-track">
        {run.map((w, i) => <span key={i}>{w}</span>)}
      </div>
    </div>
  );
}

function About() {
  return (
    <section className="about" id="about">
      <div className="wrap about-grid">
        <Reveal className="about-figure">
          <img src="assets/photos/about.jpg" alt="Nails De Maison nail artistry" />
          <div className="tag">est. Buford</div>
        </Reveal>
        <Reveal as="div" className="about-copy">
          <Eyebrow>The House</Eyebrow>
          <h2>A beauty space<br />shaped with intention.</h2>
          <p className="ndm-lead">
            Nails De Maison is a place where guests in Buford can slow down and enjoy care
            delivered with clarity and purpose.
          </p>
          <p>
            We pay close attention to what each guest needs, so every service feels clear,
            comfortable, and thoughtfully prepared. Our team approaches every detail with steady
            focus, ensuring your visit carries the feeling of being welcomed into a house that
            values ease, comfort, and personal expression.
          </p>
          <div className="about-sign">
            <Button variant="outline" href="#services" icon="arrowRight">Explore the menu</Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
Object.assign(window, { Strip, About });
