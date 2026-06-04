/* BookingModal.jsx — branded popup that embeds Square's real booking widget.
   Opened from anywhere via openBooking(); Square owns availability,
   confirmation, and the text/email notifications to the salon. */
function BookingModal() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const onOpen = () => { setLoaded(false); setOpen(true); };
    window.addEventListener('ndm-book', onOpen);
    return () => window.removeEventListener('ndm-book', onOpen);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open]);

  return (
    <div className={`bm-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
      <div className="bm bm--square" onClick={(e) => e.stopPropagation()}>
        <div className="bm-head">
          <div>
            <div className="sub" style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--rose-deep)', marginBottom: 6 }}>Reservations</div>
            <div className="ttl">Book your visit</div>
          </div>
          <button className="bm-close" aria-label="Close" onClick={() => setOpen(false)}><Icon name="x" /></button>
        </div>

        <div className="bm-frame-wrap">
          {open && (
            <iframe
              title="Book an appointment — Nails De Maison"
              src={NDM.square}
              onLoad={() => setLoaded(true)}
              allow="payment"
            ></iframe>
          )}
          {!loaded && (
            <div className="bm-frame-loading">
              <span className="bm-spinner" aria-hidden="true"></span>
              Loading the booking calendar…
            </div>
          )}
        </div>

        <div className="bm-note">
          Secure booking by Square — you'll get a confirmation by text.
          {' '}Trouble loading? <a href={NDM.square} target="_blank" rel="noreferrer">Open in a new tab →</a>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { BookingModal });
