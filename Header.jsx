/* Header.jsx */
function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const links = [
    ['About', '#about'], ['Services', '#services'], ['The Visit', '#ritual'],
    ['Shades', '#gallery'], ['Visit Us', '#booking'],
  ];
  return (<>
    <header className={`hdr ${scrolled ? 'scrolled' : ''}`}>
      <div className="wrap hdr-inner">
        <Brand onInk={false} />
        <nav className="nav">
          {links.map(([t, h]) => <a key={h} href={h}>{t}</a>)}
        </nav>
        <div className="hdr-cta">
          <Button variant={scrolled ? 'solid' : 'outline'} icon="calendar" onClick={() => openBooking()}>Book Now</Button>
          <button className="menu-btn" aria-label="Menu" onClick={() => setMenu(true)}><Icon name="menu" /></button>
        </div>
      </div>
    </header>
    <div className={`mnav ${menu ? 'open' : ''}`}>
      <button className="close" aria-label="Close" onClick={() => setMenu(false)}><Icon name="x" /></button>
      {links.map(([t, h]) => <a key={h} href={h} onClick={() => setMenu(false)}>{t}</a>)}
      <Button variant="cream" icon="calendar" onClick={() => { setMenu(false); openBooking(); }}>Book Now</Button>
    </div>
  </>);
}
Object.assign(window, { Header });
