/* BookingModal.jsx — our own branded booking calendar.
   The customer picks a service (with price + duration), then a date, a time,
   and enters their details. Services, availability, and the booking itself are
   all resolved against the live Square catalog via same-origin /api/* (Netlify
   Functions); this file never sees the secret token. On confirm we create a real
   Square booking and Square sends the customer a confirmation by text/email.
   Payment happens in person at the salon, so the 10% online-booking discount is
   shown here and applied at checkout. Falls back to "please call us" on any API
   error. */

/* ---- discounts: 10% for booking online, 20% on "Sunday Funday" ----
   The rate is keyed off the appointment's day in the salon's local time
   (America/New_York) so a guest booking from another time zone still gets the
   rate that matches the day they actually come in. Shown here, applied at the salon. */
const ONLINE_DISCOUNT = 0.10;
const SUNDAY_DISCOUNT = 0.20;
const SALON_TZ = 'America/New_York';
function isSalonSunday(when) {
  if (!when) return false;
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: SALON_TZ, weekday: 'short' }).format(new Date(when)) === 'Sun';
  } catch (_) { return false; }
}
function discountRate(when) { return isSalonSunday(when) ? SUNDAY_DISCOUNT : ONLINE_DISCOUNT; }
function discountPct(when) { return Math.round(discountRate(when) * 100); }

/* ---- date helpers ---- */
function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function sameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function fmtTime(iso) {
  try { return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }); }
  catch (_) { return iso; }
}
function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }); }
  catch (_) { return iso; }
}

/* ---- price helpers ---- */
function money(n) {
  if (n == null) return "";
  const v = Math.round(n * 100) / 100;
  return "$" + (Number.isInteger(v) ? v.toFixed(0) : v.toFixed(2));
}
function discounted(n, when) { return n == null ? null : n * (1 - discountRate(when)); }

/* ---- service display + grouping ----
   Names come straight from the Square catalog; we only tidy casing for display
   and bucket services into a few friendly categories so the list isn't a wall. */
function svcLabel(s) {
  let n = (s.serviceName || s.name || "").trim();
  n = n.replace(/\bsns\b/gi, "SNS");
  return n.charAt(0).toUpperCase() + n.slice(1);
}
const SVC_CATEGORIES = [
  ["Manicures", (s) => /manicure/.test(s) && !/sns/.test(s)],
  ["SNS / Dip", (s) => /sns/.test(s)],
  ["Full Sets", (s) => /full set|pink\s*&\s*white/.test(s)],
  ["Pedicures", (s) => /pedicure/.test(s)],
  ["Lashes", (s) => /lash/.test(s)],
  ["Waxing & Tint", (s) => /wax|tint|lamination/.test(s)],
  ["Add-ons", (s) => /add[\s-]?in|add[\s-]?on/.test(s)],
];
/* What each service includes (from the salon brochure). Keyed by the stable
   Square itemVariationId so a rename can't attach the wrong list. Only services
   with a defined list show a "What's included" panel when selected. */
const SERVICE_INCLUDES = {
  SU2DMKSZ4WDPB5IAV5YHJAQ4: ["Warm soak", "Nail shaping", "Cuticle care", "Lotion massage", "Color of choice"], // Manicure
  "5GVNJZPYJN55S4XSBSF3DX2J": ["Warm soak", "Nail shaping", "Cuticle care", "Lotion massage", "Color of choice", "Sugar scrub", "Hot towel"], // Deluxe manicure
  FCDBDG5KJYK2VXSTUF6K6LNF: ["Warm soak", "Nail shaping", "Cuticle care", "Lotion massage", "Color of choice", "Sugar scrub", "Hot towel", "Paraffin wax", "Neck massage"], // Signature manicure
  TVBXDVVPONP2TELAGYHW5YCH: ["Warm soak", "Nail shaping", "Cuticle care", "Lotion massage", "Gel polish of choice"], // Gel manicure
  C5HVHMD4ABRIKSBTED7W3OCG: ["Warm soak", "Nail shaping", "Cuticle care", "Hydrating foot massage", "Color of choice", "Sugar scrub"], // Regular pedicure
  "7CU54EJ3MUTSSII2TIOAOKMB": ["Aromatherapy soak", "Nail shaping", "Cuticle care", "Hydrating foot massage", "Color of choice", "Sugar scrub", "Warm towel"], // Chamomile pedicure
  HRJKXQAOZDVLRVHUBDSGK6SI: ["Aromatherapy soak", "Nail shaping", "Cuticle care", "Hydrating foot massage", "Color of choice", "Sugar scrub", "Warm towel", "Paraffin wax"], // Chamomile deluxe
  LCT3QBY5FKVIA573BUNLQBZJ: ["Volcano soak", "Nail shaping", "Cuticle care", "Hydrating foot massage", "Color of choice", "Sugar scrub", "Warm towel"], // Volcano spa
  MLRCVY5VAQFBHGRBJE5D43TI: ["Volcano soak", "Nail shaping", "Cuticle care", "Hydrating foot massage", "Color of choice", "Sugar scrub", "Warm towel", "Paraffin wax"], // Volcano deluxe
  A5YDBF55YFFZMRYIZCWBTTT5: ["Jelly soak", "Nail shaping", "Cuticle care", "Hydrating foot massage", "Color of choice", "Warm towel", "Paraffin wax"], // Collagen spa
  K5SWJXVRE2VPYRYJ4MPDAJPB: ["Jelly soak", "Nail shaping", "Cuticle care", "Hydrating foot massage", "Color of choice", "Warm towel", "Paraffin wax", "Foot stone massage", "Shoulder massage"], // Collagen deluxe
};

function groupServices(list) {
  const groups = SVC_CATEGORIES.map(([label]) => ({ label, items: [] }));
  const other = { label: "More", items: [] };
  for (const s of list) {
    const key = (s.serviceName || s.name || "").toLowerCase();
    let i = 0;
    for (; i < SVC_CATEGORIES.length; i++) {
      if (SVC_CATEGORIES[i][1](key)) { groups[i].items.push(s); break; }
    }
    if (i === SVC_CATEGORIES.length) other.items.push(s);
  }
  return groups.concat(other.items.length ? [other] : []).filter((g) => g.items.length);
}

function CalFallback({ booking }) {
  return (
    <div className="bm-error">
      {booking
        ? "We couldn't complete that booking just now. "
        : "Online booking is briefly unavailable. "}
      Please call us at <a href={NDM.phoneHref}>{NDM.phone}</a> and we'll get you right in.
    </div>
  );
}

function Calendar({ month, setMonth, date, setDate, today, maxDate }) {
  const y = month.getFullYear(), m = month.getMonth();
  const first = new Date(y, m, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));
  const label = first.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const prevDisabled = y === today.getFullYear() && m <= today.getMonth();
  // Don't let the customer page past the month that holds the 3-month cutoff.
  const nextDisabled = y > maxDate.getFullYear() ||
    (y === maxDate.getFullYear() && m >= maxDate.getMonth());
  const dow = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  return (
    <div>
      <div className="bm-cal-head">
        <div className="mo">{label}</div>
        <div className="bm-cal-nav">
          <button disabled={prevDisabled} aria-label="Previous month"
            onClick={() => setMonth(new Date(y, m - 1, 1))}><Icon name="chevronLeft" /></button>
          <button disabled={nextDisabled} aria-label="Next month"
            onClick={() => setMonth(new Date(y, m + 1, 1))}><Icon name="chevronRight" /></button>
        </div>
      </div>
      <div className="bm-grid">
        {dow.map((d) => <div key={d} className="bm-dow">{d}</div>)}
        {cells.map((c, i) => c == null
          ? <div key={"e" + i} />
          : (
            <button key={c.toISOString()} type="button"
              className={`bm-day ${sameDay(c, date) ? "sel" : ""} ${sameDay(c, today) ? "today" : ""}`}
              disabled={c < today || c > maxDate} onClick={() => setDate(c)}>{c.getDate()}</button>
          ))}
      </div>
    </div>
  );
}

function ServicePicker({ state, services, onPick, onRetry }) {
  if (state === "loading") {
    return <div className="bm-slots-msg"><span className="bm-spinner" /> Loading our menu…</div>;
  }
  if (state === "error") {
    return (
      <div className="bm-slots-msg">
        Couldn't load the menu.{" "}
        <button className="bm-linkbtn" onClick={onRetry}>Try again</button>
      </div>
    );
  }
  return (
    <div className="bm-svc-list">
      {groupServices(services).map((g) => (
        <div className="bm-svc-group" key={g.label}>
          <div className="bm-svc-cat">{g.label}</div>
          {g.items.map((s) => (
            <button key={s.serviceVariationId} type="button" className="bm-svc" onClick={() => onPick(s)}>
              <span className="nm">{svcLabel(s)}</span>
              <span className="meta">
                <span className="pr">{money(s.price)}</span>
              </span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function BookingModal() {
  const [open, setOpen] = useState(false);

  const today = startOfDay(new Date());
  // Customers can book at most 3 months out.
  const maxDate = startOfDay(new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()));
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [date, setDate] = useState(null);

  // services (loaded once from the live Square catalog)
  const [services, setServices] = useState([]);
  const [servicesState, setServicesState] = useState("idle"); // idle | loading | done | error
  const [service, setService] = useState(null);

  const [slots, setSlots] = useState([]);
  const [slotState, setSlotState] = useState("idle"); // idle | loading | done | error
  const [slot, setSlot] = useState(null);

  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [bookError, setBookError] = useState(false);
  const [success, setSuccess] = useState(null);

  function resetAll() {
    setService(null);
    setDate(null); setSlots([]); setSlot(null); setSlotState("idle");
    setForm({ name: "", phone: "", email: "" });
    setSubmitting(false); setBookError(false); setSuccess(null);
    setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  // open / close wiring
  useEffect(() => {
    const onOpen = () => { resetAll(); setOpen(true); };
    window.addEventListener("ndm-book", onOpen);
    // Deep link: arriving at /book (or ?book=1 / #book) opens the modal straight
    // away, so ads and links can drop visitors right on the booking step.
    const path = location.pathname.replace(/\/+$/, "");
    if (path === "/book" ||
        new URLSearchParams(location.search).has("book") ||
        location.hash === "#book") {
      (window.dataLayer = window.dataLayer || []).push({ event: "booking_open", source: "deeplink" });
      onOpen();
    }
    return () => window.removeEventListener("ndm-book", onOpen);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = open ? "hidden" : "";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  // load the bookable services (with prices) the first time the modal opens
  function loadServices() {
    setServicesState("loading");
    fetch("/api/services")
      .then((r) => { if (!r.ok) throw new Error("status"); return r.json(); })
      .then((d) => {
        const list = (d.services || []).filter(
          (s) => s.price != null && !/book your appointment/i.test(s.serviceName || s.name || "")
        );
        setServices(list);
        setServicesState("done");
      })
      .catch(() => setServicesState("error"));
  }
  useEffect(() => {
    if (open && servicesState === "idle") loadServices();
  }, [open]);

  // fetch real availability whenever a service + date are chosen
  useEffect(() => {
    if (!date || !service) { setSlots([]); setSlotState("idle"); return; }
    let cancelled = false;
    setSlot(null); setSlots([]); setSlotState("loading");
    const dayStart = startOfDay(date);
    const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 0);
    const now = new Date();
    const from = (dayStart < now ? now : dayStart).toISOString();
    const to = dayEnd.toISOString();
    const url = "/api/availability?serviceVariationId=" + encodeURIComponent(service.serviceVariationId) +
      "&from=" + encodeURIComponent(from) + "&to=" + encodeURIComponent(to);
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error("status"); return r.json(); })
      .then((d) => { if (!cancelled) { setSlots(d.slots || []); setSlotState("done"); } })
      .catch(() => { if (!cancelled) setSlotState("error"); });
    return () => { cancelled = true; };
  }, [date, service]);

  function pickService(s) { setService(s); setDate(null); setSlot(null); setSlots([]); setSlotState("idle"); }
  function changeService() { setService(null); setDate(null); setSlot(null); setSlots([]); setSlotState("idle"); }

  function canConfirm() {
    return !!(service && slot && form.name.trim() && form.phone.trim() && !submitting);
  }

  async function confirm() {
    if (!canConfirm()) return;
    setSubmitting(true); setBookError(false);
    try {
      const r = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceVariationId: slot.serviceVariationId,
          serviceVariationVersion: slot.serviceVariationVersion,
          teamMemberId: slot.teamMemberId,
          startAt: slot.startAt,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok) throw new Error("book failed");
      setSuccess({ startAt: slot.startAt, bookingId: data.bookingId, service, price: service.price });
    } catch (_) {
      setBookError(true);
    } finally {
      setSubmitting(false);
    }
  }

  const close = () => setOpen(false);

  return (
    <div className={`bm-overlay ${open ? "open" : ""}`} onClick={close}>
      <div className="bm" onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label="Book your visit">
        <div className="bm-head">
          <div>
            <div className="sub">Reservations</div>
            <div className="ttl">Book your visit</div>
          </div>
          <button className="bm-close" aria-label="Close" onClick={close}><Icon name="x" /></button>
        </div>

        <div className="bm-body">
          {success ? (
            <div className="bm-success">
              <div className="check"><Icon name="check" /></div>
              <h3>You're booked.</h3>
              <p>Your visit is reserved and <strong>no payment was taken</strong> — a confirmation is on its way by text and email. You'll pay at the salon when you visit.</p>
              <div className="recap">
                {svcLabel(success.service)}<br />
                {fmtDate(success.startAt)}<br />{fmtTime(success.startAt)}
              </div>
              <div className="bm-success-price">
                <s>{money(success.price)}</s> {money(discounted(success.price, success.startAt))}
                <span> · {discountPct(success.startAt)}% off, applied at the salon</span>
              </div>
              <div style={{ marginTop: 22 }}>
                <button className="btn btn-outline" onClick={resetAll}>Book another</button>
              </div>
            </div>
          ) : (
            <>
              <div className="bm-promo">
                <span className="tag">10% Off</span>
                <span>Book online and save 10% — or <strong>20% every Sunday</strong>. Applied at the salon.</span>
              </div>
              <div className="bm-paynote bm-paynote--intro">
                <Icon name="info" className="ic" />
                <span><strong>No payment here — this isn't a checkout.</strong> The price you see is the regular service price with your online discount applied. You'll only see your savings now and pay in person at the salon.</span>
              </div>

              {!service ? (
                <>
                  {/* 1 — service */}
                  <div className="bm-section-label">1 · Choose your service</div>
                  <ServicePicker state={servicesState} services={services}
                    onPick={pickService} onRetry={loadServices} />
                </>
              ) : (
                <>
                  {/* chosen service + what's included */}
                  <div className="bm-svc-chosen">
                    <div className="bm-svc-chosen-top">
                      <div className="info">
                        <span className="lbl">Service</span>
                        <span className="nm">{svcLabel(service)}</span>
                      </div>
                      <div className="right">
                        <span className="pr">{money(service.price)}</span>
                        <button className="bm-linkbtn" onClick={changeService}>Change</button>
                      </div>
                    </div>
                    {SERVICE_INCLUDES[service.serviceVariationId] && (
                      <div className="bm-includes-wrap">
                        <div className="bm-includes-label">What's included</div>
                        <ul className="bm-includes">
                          {SERVICE_INCLUDES[service.serviceVariationId].map((x) => (
                            <li key={x}><Icon name="check" className="ic" /> {x}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* 2 — date */}
                  <div className="bm-section-label">2 · Pick a date</div>
                  <Calendar month={month} setMonth={setMonth} date={date}
                    setDate={(d) => { setDate(d); setSlot(null); }} today={today} maxDate={maxDate} />

                  {/* 3 — time */}
                  {date && (
                    <>
                      <div className="bm-section-label" style={{ marginTop: 18 }}>3 · Choose a time</div>
                      {date.getDay() === 0 && (
                        <div className="bm-sunday-note"><span className="tag">Sunday Funday</span> 20% off applies to this date.</div>
                      )}
                      {slotState === "loading" && (
                        <div className="bm-slots-msg"><span className="bm-spinner" /> Finding open times…</div>
                      )}
                      {slotState === "error" && (
                        <div className="bm-slots-msg">
                          Couldn't load times.{" "}
                          <button className="bm-linkbtn" onClick={() => setDate(new Date(date))}>Try again</button>
                        </div>
                      )}
                      {slotState === "done" && slots.length === 0 && (
                        <div className="bm-slots-msg">No open times this day — please try another date.</div>
                      )}
                      {slotState === "done" && slots.length > 0 && (
                        <div className="bm-slots">
                          {slots.map((s) => (
                            <button key={s.startAt + (s.teamMemberId || "")} type="button"
                              className={`bm-slot ${slot && slot.startAt === s.startAt && slot.teamMemberId === s.teamMemberId ? "sel" : ""}`}
                              onClick={() => setSlot(s)}>{fmtTime(s.startAt)}</button>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* 4 — details */}
                  {slot && (
                    <>
                      <div className="bm-divider" />
                      <div className="bm-section-label">4 · Your details</div>
                      <div className="bm-fields">
                        <div className="bm-field">
                          <label>Name</label>
                          <input value={form.name} placeholder="First Last"
                            onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div className="bm-field">
                          <label>Phone</label>
                          <input value={form.phone} placeholder="(470) 000 0000" inputMode="tel"
                            onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                        </div>
                        <div className="bm-field full">
                          <label>Email <span className="opt">(optional — for your confirmation)</span></label>
                          <input value={form.email} placeholder="you@email.com" inputMode="email"
                            onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        </div>
                      </div>

                      {/* 5 — confirm summary */}
                      <div className="bm-confirm">
                        <div className="row"><span>Service</span><span>{svcLabel(service)}</span></div>
                        <div className="row"><span>When</span><span>{fmtDate(slot.startAt)} · {fmtTime(slot.startAt)}</span></div>
                        <div className="row total">
                          <span>Price</span>
                          <span><s>{money(service.price)}</s> {money(discounted(service.price, slot.startAt))}</span>
                        </div>
                        <div className="bm-discount">{discountPct(slot.startAt)}% off — applied when you pay at the salon</div>
                        <div className="bm-paynote">
                          <Icon name="info" className="ic" />
                          <span><strong>You won't be charged now.</strong> We're only showing your discounted price — booking just reserves your time. You'll pay in person at the salon when you visit.</span>
                        </div>
                      </div>
                    </>
                  )}

                  {bookError && <CalFallback booking />}

                  <div className="bm-foot">
                    <div className="bm-summary">
                      {slot ? (
                        <><strong>{money(discounted(service.price, slot.startAt))}</strong> · you pay at the salon, not now</>
                      ) : (
                        <span>Pick a date and time to continue.</span>
                      )}
                    </div>
                    <button className="btn btn-solid" disabled={!canConfirm()} onClick={confirm}>
                      {submitting ? "Booking…" : "Confirm Appointment"}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { BookingModal });
