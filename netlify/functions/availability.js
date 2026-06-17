/* GET /api/availability?serviceVariationId=&teamMemberId=&from=&to=
   Proxies Square's SearchAvailability and returns real open slots. Each slot
   carries the team member + service variation version needed to actually book
   it, so the booking step is unambiguous. */
const {
  getClient,
  locationId,
  json,
  preflight,
  errorResponse,
  resolveDefaultServiceVariationId,
  maxBookingDate,
} = require("./_square");

/* Published salon hours, salon-local (America/New_York). 0 = Sun … 6 = Sat.
   Square's availability occasionally surfaces a pre-open slot (e.g. 9:30a on a
   weekday); we enforce the real opening time here so the picker never offers a
   time before we're open. Sunday opens at noon; every other day at 10am. */
const OPEN_HOUR = { 0: 12, 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10 };
function withinSalonHours(iso) {
  try {
    const dt = new Date(iso);
    const wd = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short" }).format(dt);
    const hm = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hour12: false }).format(dt);
    const day = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[wd];
    const [h, m] = hm.split(":").map(Number);
    return (h % 24) * 60 + m >= (OPEN_HOUR[day] != null ? OPEN_HOUR[day] : 10) * 60;
  } catch (_) {
    return true; // never hide a slot on a parsing error
  }
}

exports.handler = async (event) => {
  const pre = preflight(event);
  if (pre) return pre;
  if (event.httpMethod !== "GET") return json(405, { ok: false, error: "method_not_allowed" });

  try {
    const q = event.queryStringParameters || {};
    const client = getClient();

    // The customer only picks a date/time — the service is resolved server-side.
    const serviceVariationId = q.serviceVariationId || (await resolveDefaultServiceVariationId(client));
    if (!serviceVariationId) {
      return json(400, { ok: false, error: "no_bookable_service" });
    }

    const now = new Date();
    const maxWindow = maxBookingDate(); // 3 months out
    const fromReq = q.from ? new Date(q.from) : now;
    // Nothing is bookable beyond the 3-month window.
    if (fromReq > maxWindow) return json(200, { ok: true, slots: [] });
    // Square rejects a start range in the past; clamp to "now".
    const startAt = (fromReq < now ? now : fromReq).toISOString();
    const toReq = q.to ? new Date(q.to) : new Date(fromReq.getTime() + 24 * 60 * 60 * 1000);
    // Never search past the 3-month cutoff.
    const endAt = (toReq > maxWindow ? maxWindow : toReq).toISOString();

    const segmentFilter = { serviceVariationId };
    if (q.teamMemberId) segmentFilter.teamMemberIdFilter = { any: [q.teamMemberId] };

    const { result } = await client.bookingsApi.searchAvailability({
      query: {
        filter: {
          startAtRange: { startAt, endAt },
          locationId: locationId(),
          segmentFilters: [segmentFilter],
        },
      },
    });

    const slots = (result.availabilities || []).filter((a) => withinSalonHours(a.startAt)).map((a) => {
      const seg = (a.appointmentSegments || [])[0] || {};
      return {
        startAt: a.startAt,
        locationId: a.locationId,
        teamMemberId: seg.teamMemberId,
        serviceVariationId: seg.serviceVariationId,
        serviceVariationVersion:
          seg.serviceVariationVersion != null ? seg.serviceVariationVersion.toString() : null,
        durationMinutes: seg.durationMinutes != null ? Number(seg.durationMinutes) : null,
      };
    });

    return json(200, { ok: true, slots });
  } catch (err) {
    return errorResponse(err);
  }
};
