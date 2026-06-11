/* ui.jsx — shared atoms, icons, data for Nails De Maison site */
const { useState, useEffect, useRef } = React;

/* ---- Icons: official Lucide paths, inlined for React stability ---- */
const ICONS = {
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mapPin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  instagram: '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>',
  facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  google: '<path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"/>',
  arrowRight: '<line x1="5" x2="19" y1="12" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  arrowUpRight: '<line x1="7" x2="17" y1="17" y2="7"/><polyline points="7 7 17 7 17 17"/>',
  chevronLeft: '<polyline points="15 18 9 12 15 6"/>',
  chevronRight: '<polyline points="9 18 15 12 9 6"/>',
  chevronDown: '<polyline points="6 9 12 15 18 9"/>',
  menu: '<line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/>',
  x: '<line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  clock4: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
};
function Icon({ name, className = 'ic', star }) {
  if (star) {
    return (<svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);
  }
  if (name === 'google') {
    return (<svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none"
      dangerouslySetInnerHTML={{ __html: ICONS[name] }} />);
  }
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    dangerouslySetInnerHTML={{ __html: ICONS[name] }} />);
}

/* ---- Booking: open the calendar modal from anywhere ---- */
function openBooking(detail) {
  // Track every booking-modal open in GTM (build a conversion/retargeting
  // trigger on the "booking_open" event). source tells button clicks apart
  // from deep-link arrivals at /book.
  (window.dataLayer = window.dataLayer || []).push({
    event: 'booking_open',
    source: (detail && detail.source) || 'button',
  });
  window.dispatchEvent(new CustomEvent('ndm-book', { detail: detail || {} }));
}

/* ---- Button ---- */
function Button({ variant = 'solid', children, icon, href, onClick, ...rest }) {
  const cls = `btn btn-${variant}`;
  const inner = (<>{children}{icon && <Icon name={icon} className="ic" />}</>);
  if (href) return <a className={cls} href={href} onClick={onClick} {...rest}>{inner}</a>;
  return <button className={cls} onClick={onClick} {...rest}>{inner}</button>;
}

/* ---- Eyebrow ---- */
function Eyebrow({ children, center, onInk }) {
  return <div className={`eyebrow${center ? ' center' : ''}${onInk ? ' on-ink' : ''}`}>{children}</div>;
}

/* ---- Reveal on scroll ---- */
function Reveal({ children, delay = 0, as = 'div', className = '', style = {}, onClick }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    // already in view on mount? reveal immediately (covers initial above-the-fold)
    const inView = () => {
      const r = el.getBoundingClientRect();
      return r.top < (window.innerHeight || 0) * 0.92 && r.bottom > 0;
    };
    if (inView()) { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    // safety: never leave content hidden if the observer never fires
    const t = setTimeout(() => setSeen(true), 1600);
    return () => { io.disconnect(); clearTimeout(t); };
  }, []);
  const Tag = as;
  return <Tag ref={ref} onClick={onClick} className={`reveal ${seen ? 'in' : ''} ${className}`}
    style={{ ...style, transitionDelay: `${delay}ms` }}>{children}</Tag>;
}

/* ---- Brand lockup ---- */
function Brand({ onInk }) {
  const src = onInk ? 'assets/logo-emblem-cream.png' : 'assets/logo-emblem-ink.png';
  return (<a className="brand" href="#top">
    <img src={src} alt="Nails De Maison emblem" />
    <span className="bn">NAILS DE MAISON</span>
  </a>);
}

/* ---- Shared business data ---- */
const NDM = {
  phone: '(470) 899-8068',
  phoneHref: 'tel:+14708998068',
  // Square Appointments booking widget (real scheduler — handles availability,
  // confirmation, and text/email notifications to the salon).
  square: 'https://app.squareup.com/appointments/buyer/widget/ytjq1rstefb3fj/LY8Q289WDMKMH',
  email: 'v.kat.globaldemaison@gmail.com',
  address: '3264 Buford Dr, Buford, GA 30519',
  hours: [
    ['Monday – Saturday', '10:00a — 7:00p'],
    ['Sunday', '12:00p — 5:00p'],
  ],
  instagram: 'https://www.instagram.com/nailsdemaison/',
  facebook: 'https://www.facebook.com/profile.php?id=61583965245358',
  google: 'https://www.google.com/search?q=nailsdemaison&oq=nailsdemaison&gs_lcrp=EgZjaHJvbWUqBggAEEUYOzIGCAAQRRg7MgkIARAAGA0YgAQyDwgCEC4YDRivARjHARiABDIJCAMQABgNGIAEMgkIBBAAGA0YgAQyBggFEEUYPDIGCAYQRRg9MgYIBxBFGD3SAQgyNDE2ajBqN6gCALACAA&sourceid=chrome&ie=UTF-8',
  mapSrc: 'https://maps.google.com/maps?q=3264%20Buford%20Dr%2C%20Buford%2C%20GA%2030519&t=m&z=15&output=embed&iwloc=near',
};

const SERVICES = {
  manicure: {
    label: 'Manicure', count: 'Hands',
    rows: [
      { name: 'Classic Manicure', price: '$20', desc: 'Shape, cuticle care, a flawless coat of polish.' },
      { name: 'Deluxe', price: '$30', desc: 'Classic care with exfoliation & a warm hand massage.' },
      { name: 'Gel Manicure', price: '$35', desc: 'High shine gel that keeps its luster for weeks.' },
      { name: 'Signature', price: '$40', desc: 'The full maison ritual, every thoughtful touch.' },
    ],
  },
  pedicure: {
    label: 'Pedicure', count: 'Feet',
    rows: [
      { name: 'Regular', price: '$35', desc: 'Soak, shape, smooth, and a finishing polish.' },
      { name: 'Chamomile Spa', price: '$45', desc: 'A calming botanical soak that quiets the day.' },
      { name: 'Chamomile Deluxe', price: '$50', desc: 'Extended scrub, mask, and restorative massage.' },
      { name: 'Volcano Spa', price: '$55', desc: 'A warm, mineral ritual for tired feet.' },
    ],
  },
};

const SHADES = [
  { src: 'assets/photos/work-01.jpg' },
  { src: 'assets/photos/work-02.jpg' },
  { src: 'assets/photos/work-03.jpg' },
  { src: 'assets/photos/work-04.jpg' },
  { src: 'assets/photos/work-05.jpg' },
  { src: 'assets/photos/work-06.jpg' },
  { src: 'assets/photos/work-07.jpg' },
  { src: 'assets/photos/work-08.jpg' },
  { src: 'assets/photos/work-09.jpg' },
  { src: 'assets/photos/work-10.jpg' },
  { src: 'assets/photos/work-11.jpg' },
  { src: 'assets/photos/work-12.jpg' },
];

/* ---- Curated Google reviews (real, hand-picked) ----
   To add a new review: copy a card below — text, name, stars (1–5).
   Keep the wording exactly as the guest wrote it. */
const REVIEWS = [
  {
    stars: 5,
    name: 'Lanla Pham',
    text: "Very clean, friendly, and professional. I love this place and I'll definitely come back!",
  },
  {
    stars: 5,
    name: 'Amanda Nunez',
    text: "My first time getting my nails done in years and I LOVE them!! The shape and the color so beautiful!!",
  },
  {
    stars: 5,
    name: 'Amy N',
    text: "Not gonna lie, I don't usually write reviews but this salon is worth it. Everything feels clean and organized. The staff are professional but still very friendly, which I appreciate. Really smooth, comfortable experience. I definitely will be back!",
  },
];

Object.assign(window, { useState, useEffect, useRef, Icon, Button, Eyebrow, Reveal, Brand, NDM, SERVICES, SHADES, REVIEWS, openBooking });
