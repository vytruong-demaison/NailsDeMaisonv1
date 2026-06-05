/* Gallery.jsx — shades lookbook with lightbox */
function Gallery() {
  const [open, setOpen] = useState(-1);
  const close = () => setOpen(-1);
  const go = (d) => setOpen((i) => (i + d + SHADES.length) % SHADES.length);
  useEffect(() => {
    const onKey = (e) => {
      if (open < 0) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <section className="gallery" id="gallery">
      <div className="wrap">
        <div className="gallery-head">
          <Reveal>
            <Eyebrow>Our Work</Eyebrow>
            <h2>Straight from our Instagram.</h2>
          </Reveal>
          <Reveal delay={80}>
            <Button variant="outline" href={NDM.instagram} icon="instagram" target="_blank" rel="noreferrer">
              See more on Instagram
            </Button>
          </Reveal>
        </div>

        <div className="grid-shades">
          {SHADES.map((s, i) => (
            <Reveal className="shade" key={s.src} delay={(i % 6) * 60} onClick={() => setOpen(i)}>
              <img src={s.src} alt={`Nails De Maison nail work ${i + 1}`} loading="lazy" />
            </Reveal>
          ))}
        </div>
      </div>

      <div className={`lb ${open >= 0 ? 'open' : ''}`} onClick={close}>
        {open >= 0 && (<>
          <button className="lb-close" aria-label="Close" onClick={close}><Icon name="x" /></button>
          <button className="lb-nav lb-prev" aria-label="Previous" onClick={(e) => { e.stopPropagation(); go(-1); }}><Icon name="chevronLeft" /></button>
          <button className="lb-nav lb-next" aria-label="Next" onClick={(e) => { e.stopPropagation(); go(1); }}><Icon name="chevronRight" /></button>
          <div className="lb-card" onClick={(e) => e.stopPropagation()}>
            <img src={SHADES[open].src} alt={`Nails De Maison nail work ${open + 1}`} />
          </div>
        </>)}
      </div>
    </section>
  );
}
Object.assign(window, { Gallery });
