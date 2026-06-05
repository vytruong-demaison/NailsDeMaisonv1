# Booking setup — Square Appointments

The site books directly into **Square Appointments** through our own branded
calendar (no Square iframe). The browser only ever talks to same-origin
`/api/*` endpoints; the secret Square token lives only in Netlify env vars.

## Architecture

The customer only picks a **date → time → details**. They never see a service
list or price — the Square service + staff are resolved server-side (using a
single default "appointment" service), so the booking still satisfies Square's
API requirements.

```
BookingModal.jsx ──fetch──> /api/availability  (Square SearchAvailability -> real open slots)
                 ──fetch──> /api/book          (CreateCustomer -> CreateBooking)
                                   │
                            netlify/functions/*  (square SDK, SQUARE_ACCESS_TOKEN server-side)
                                   │
                            default service: SQUARE_DEFAULT_SERVICE_VARIATION_ID,
                            else auto-picked from the catalog.
```

(`/api/services` still exists for debugging/catalog listing, but the modal no
longer calls it.)

- `netlify.toml` redirects `/api/*` → `/.netlify/functions/*`.
- All Square responses are normalized server-side (incl. BigInt `version`).

## 1. Environment variables (Netlify → Site settings → Environment variables)

| Variable | Value |
| --- | --- |
| `SQUARE_ACCESS_TOKEN` | **Production** access token (Square Developer Dashboard → your app → Production). Keep secret. |
| `SQUARE_LOCATION_ID` | The salon's location id. |
| `SQUARE_ENVIRONMENT` | `production` (or `sandbox` while testing). |

Never commit these. `.env.example` shows the shape; copy to `.env` for local
testing only (git-ignored).

## 2. Confirm your catalog IDs (optional sanity check)

The frontend loads services dynamically from `/api/services`, so you normally
don't need to hard-code anything. To verify the IDs Square will use:

```bash
npm install
SQUARE_ACCESS_TOKEN=... SQUARE_LOCATION_ID=... SQUARE_ENVIRONMENT=production \
  npm run catalog
```

It prints every bookable service variation (`itemVariationId`, version,
duration, price, name) and every team-member booking profile id. Make sure your
menu — Manicure, Deluxe, Gel, Signature, and the Pedicure variants — shows up
as **bookable Appointment services** in Square; only those appear here.

## 3. Run locally

```bash
npm install
npm i -g netlify-cli   # if you don't have it
netlify dev            # serves the static site + /api/* functions on one origin
```

Open the printed URL, click **Book Now**, and step through date → time →
details. Without valid env vars the modal degrades gracefully to a
"please call us" message.

> Confirmations: Square emails/texts the customer automatically based on your
> **Appointments → Settings → Communications** notification settings. Make sure
> customer notifications are turned on in the Square dashboard; we always pass
> the guest's name, phone, and email so Square can reach them.

## 4. Deploy

Push to the repo connected to Netlify (functions dir + redirects are in
`netlify.toml`). Netlify installs `square` from `package.json` automatically.

## Acceptance checklist

- [x] Modal uses our design tokens only — no Square-blue UI on the page.
- [x] Times come from Square `SearchAvailability` (real availability).
- [x] Confirm runs `CreateCustomer` → `CreateBooking`; the booking appears in
      the Square dashboard.
- [x] Secret token only in Netlify env (server-side functions).
- [x] Any API error falls back to showing the phone number.
