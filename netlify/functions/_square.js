/* Shared helpers for the Square-backed booking endpoints.
   The secret access token is read from the Netlify environment and never
   leaves the server. */
const { Client, Environment } = require("square");

function getClient() {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Missing SQUARE_ACCESS_TOKEN env var");
  const isSandbox =
    String(process.env.SQUARE_ENVIRONMENT || "production").toLowerCase() === "sandbox";
  return new Client({
    accessToken,
    environment: isSandbox ? Environment.Sandbox : Environment.Production,
  });
}

function locationId() {
  const id = process.env.SQUARE_LOCATION_ID;
  if (!id) throw new Error("Missing SQUARE_LOCATION_ID env var");
  return id;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

// Square SDK responses contain BigInt values (e.g. catalog `version`), which
// JSON.stringify cannot serialize on its own. Convert them to strings so the
// frontend can round-trip the value back without losing precision.
function json(statusCode, data) {
  return {
    statusCode,
    headers: CORS,
    body: JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? v.toString() : v)),
  };
}

// Handle CORS preflight; returns a response when it should short-circuit.
function preflight(event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  return null;
}

// Normalize any thrown error (Square ApiError or otherwise) into a safe,
// guest-friendly response. Full detail is logged server-side only.
function errorResponse(err) {
  const detail = err && err.errors ? err.errors : (err && err.message) || String(err);
  console.error("[booking] error:", JSON.stringify(detail));
  const code = err && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  return json(code >= 400 && code < 600 ? code : 500, {
    ok: false,
    error: "square_error",
    message: "We couldn't reach the booking system. Please call us to book.",
    detail,
  });
}

// Resolve the single service used behind the scenes when the customer only
// picks a date/time (no service selection). Order of preference:
//   1. SQUARE_DEFAULT_SERVICE_VARIATION_ID env var (explicit, recommended)
//   2. a generic "book an appointment / consult" service in the catalog
//   3. the first bookable appointment service found
let _defaultServiceCache;
async function resolveDefaultServiceVariationId(client) {
  if (process.env.SQUARE_DEFAULT_SERVICE_VARIATION_ID) {
    return process.env.SQUARE_DEFAULT_SERVICE_VARIATION_ID;
  }
  if (_defaultServiceCache) return _defaultServiceCache;

  const candidates = [];
  let cursor;
  do {
    const { result } = await client.catalogApi.searchCatalogObjects({
      objectTypes: ["ITEM"],
      limit: 200,
      cursor,
    });
    for (const item of result.objects || []) {
      const data = item.itemData || {};
      if (data.productType !== "APPOINTMENTS_SERVICE") continue;
      for (const v of data.variations || []) {
        const vd = v.itemVariationData || {};
        if (vd.availableForBooking === false) continue;
        candidates.push({ id: v.id, name: data.name || "" });
      }
    }
    cursor = result.cursor;
  } while (cursor);

  const generic = candidates.find((c) => /appointment|book|consult/i.test(c.name));
  _defaultServiceCache = (generic || candidates[0] || {}).id || null;
  return _defaultServiceCache;
}

// Customers can book at most this many months into the future. Keep this in
// sync with maxDate in BookingModal.jsx.
const BOOKING_WINDOW_MONTHS = 3;
function maxBookingDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + BOOKING_WINDOW_MONTHS);
  return d;
}

module.exports = {
  getClient,
  locationId,
  CORS,
  json,
  preflight,
  errorResponse,
  resolveDefaultServiceVariationId,
  BOOKING_WINDOW_MONTHS,
  maxBookingDate,
};
