/* BookingModal.jsx — our own branded booking calendar.
   The customer simply picks a date, then a time, then enters their details.
   The Square service + staff are resolved server-side (the guest never sees a
   service list or price). On confirm we create a real Square booking and Square
   sends the customer a confirmation by text/email. All Square calls happen
   server-side via same-origin /api/* (Netlify Functions); this file never sees
   the secret token. Falls back to "please call us" on any API error. */

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

function BookingModal() {
  const [open, setOpen] = useState(false);

  const today = startOfDay(new Date());
  // Customers can book at most 3 months out.
  const maxDate = startOfDay(new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()));
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [date, setDate] = useState(null);

  const [slots, setSlots] = useState([]);
  const [slotState, setSlotState] = useState("idle"); // idle | loading | done | error
  const [slot, setSlot] = useState(null);

  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [bookError, setBookError] = useState(false);
  const [success, setSuccess] = useState(null);

  function resetAll() {
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

  // fetch real availability whenever a date is chosen (service is server-side)
  useEffect(() => {
    if (!date) { setSlots([]); setSlotState("idle"); return; }
    let cancelled = false;
    setSlot(null); setSlots([]); setSlotState("loading");
    const dayStart = startOfDay(date);
    const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 0);
    const now = new Date();
    const from = (dayStart < now ? now : dayStart).toISOString();
    const to = dayEnd.toISOString();
    const url = "/api/availability?from=" + encodeURIComponent(from) + "&to=" + encodeURIComponent(to);
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error("status"); return r.json(); })
      .then((d) => { if (!cancelled) { setSlots(d.slots || []); setSlotState("done"); } })
      .catch(() => { if (!cancelled) setSlotState("error"); });
    return () => { cancelled = true; };
  }, [date]);

  function canConfirm() {
    return !!(slot && form.name.trim() && form.phone.trim() && !submitting);
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
      setSuccess({ startAt: slot.startAt, bookingId: data.bookingId });
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
              <p>Your visit is reserved. A confirmation is on its way by text and email.</p>
              <div className="recap">{fmtDate(success.startAt)}<br />{fmtTime(success.startAt)}</div>
              <div style={{ marginTop: 22 }}>
                <button className="btn btn-outline" onClick={resetAll}>Book another</button>
              </div>
            </div>
          ) : (
            <>
              {/* 1 — date */}
              <div className="bm-section-label">1 · Pick a date</div>
              <Calendar month={month} setMonth={setMonth} date={date}
                setDate={(d) => { setDate(d); setSlot(null); }} today={today} maxDate={maxDate} />

              {/* 2 — time */}
              {date && (
                <>
                  <div className="bm-section-label" style={{ marginTop: 18 }}>2 · Choose a time</div>
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

              {/* 3 — details */}
              {slot && (
                <>
                  <div className="bm-divider" />
                  <div className="bm-section-label">3 · Your details</div>
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
                      <label>Email (for your confirmation)</label>
                      <input value={form.email} placeholder="you@email.com" inputMode="email"
                        onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                  </div>
                </>
              )}

              {bookError && <CalFallback booking />}

              <div className="bm-foot">
                <div className="bm-summary">
                  {slot ? (
                    <><strong>{fmtDate(slot.startAt)}</strong><br />{fmtTime(slot.startAt)}</>
                  ) : (
                    <span>Pick a date and time to continue.</span>
                  )}
                </div>
                <button className="btn btn-solid" disabled={!canConfirm()} onClick={confirm}>
                  {submitting ? "Booking…" : "Confirm booking"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { BookingModal });
