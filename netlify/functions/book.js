/* POST /api/book
   Body: { serviceVariationId, serviceVariationVersion?, teamMemberId, startAt,
           name, email, phone }
   Reuses (or creates) the Square customer, then creates the booking. Returns
   the new booking id + status. */
const crypto = require("crypto");
const {
  getClient,
  locationId,
  json,
  preflight,
  errorResponse,
  resolveDefaultServiceVariationId,
  maxBookingDate,
} = require("./_square");

function splitName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  const given = parts.shift() || "Guest";
  const family = parts.join(" ") || undefined;
  return { given, family };
}

exports.handler = async (event) => {
  const pre = preflight(event);
  if (pre) return pre;
  if (event.httpMethod !== "POST") return json(405, { ok: false, error: "method_not_allowed" });

  try {
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch (_) {
      return json(400, { ok: false, error: "invalid_json" });
    }

    const { teamMemberId, startAt, name, email, phone } = body;
    let serviceVariationId = body.serviceVariationId;
    let serviceVariationVersion = body.serviceVariationVersion;

    if (!teamMemberId || !startAt) {
      return json(400, {
        ok: false,
        error: "missing_fields",
        message: "teamMemberId and startAt are required.",
      });
    }
    if (!name || !phone) {
      return json(400, { ok: false, error: "missing_contact", message: "Name and phone are required." });
    }
    // Enforce the 3-month booking window server-side too.
    if (new Date(startAt) > maxBookingDate()) {
      return json(400, {
        ok: false,
        error: "outside_window",
        message: "That date is outside our 3-month booking window.",
      });
    }

    const client = getClient();

    // Customer picks only date/time; fall back to the default service if needed.
    if (!serviceVariationId) {
      serviceVariationId = await resolveDefaultServiceVariationId(client);
      serviceVariationVersion = undefined; // force a fresh version lookup below
    }

    // Resolve the catalog version server-side if the client didn't supply one.
    if (!serviceVariationVersion) {
      const { result: cat } = await client.catalogApi.retrieveCatalogObject(serviceVariationId, false);
      serviceVariationVersion = cat.object && cat.object.version != null ? cat.object.version : undefined;
    }

    // 1) Reuse an existing customer by email when possible; otherwise create one.
    let customerId;
    if (email) {
      try {
        const { result: found } = await client.customersApi.searchCustomers({
          query: { filter: { emailAddress: { exact: email } } },
        });
        if (found.customers && found.customers.length) customerId = found.customers[0].id;
      } catch (_) {
        /* non-fatal: fall through to create */
      }
    }
    if (!customerId) {
      const { given, family } = splitName(name);
      const { result: cust } = await client.customersApi.createCustomer({
        idempotencyKey: crypto.randomUUID(),
        givenName: given,
        familyName: family,
        emailAddress: email || undefined,
        phoneNumber: phone || undefined,
      });
      customerId = cust.customer && cust.customer.id;
    }

    // 2) Create the booking.
    const { result: bk } = await client.bookingsApi.createBooking({
      idempotencyKey: crypto.randomUUID(),
      booking: {
        locationId: locationId(),
        startAt,
        customerId,
        appointmentSegments: [
          {
            teamMemberId,
            serviceVariationId,
            serviceVariationVersion:
              serviceVariationVersion != null ? BigInt(serviceVariationVersion) : undefined,
          },
        ],
      },
    });

    const booking = bk.booking || {};
    return json(200, {
      ok: true,
      bookingId: booking.id,
      status: booking.status,
      startAt: booking.startAt,
    });
  } catch (err) {
    return errorResponse(err);
  }
};
