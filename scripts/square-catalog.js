#!/usr/bin/env node
/* One-off helper: print every bookable service variation and team member so
   you can confirm IDs. The frontend loads these dynamically via /api/services,
   so you usually won't need to hard-code anything — this is for verification.

   Usage:
     SQUARE_ACCESS_TOKEN=... SQUARE_LOCATION_ID=... SQUARE_ENVIRONMENT=production \
       node scripts/square-catalog.js
   or, with the values in a local .env:  npm run catalog
*/
const { Client, Environment } = require("square");

// Load .env (zero-dependency) so `npm run catalog` picks up your credentials
// without exporting them by hand. Existing env vars always win.
(function loadDotEnv() {
  try {
    const fs = require("fs");
    const path = require("path");
    const file = path.resolve(__dirname, "..", ".env");
    if (!fs.existsSync(file)) return;
    for (const raw of fs.readFileSync(file, "utf8").split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch (_) { /* ignore — fall back to real env */ }
})();

const isSandbox =
  String(process.env.SQUARE_ENVIRONMENT || "production").toLowerCase() === "sandbox";
const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: isSandbox ? Environment.Sandbox : Environment.Production,
});

(async () => {
  if (!process.env.SQUARE_ACCESS_TOKEN) {
    console.error("Set SQUARE_ACCESS_TOKEN (and SQUARE_LOCATION_ID) first.");
    process.exit(1);
  }

  console.log("\n=== Bookable services ===");
  console.log("itemVariationId\tversion\tduration\tprice\tname");
  let cursor;
  do {
    const { result } = await client.catalogApi.searchCatalogObjects({
      objectTypes: ["ITEM"],
      limit: 200,
      cursor,
    });
    for (const item of result.objects || []) {
      const d = item.itemData || {};
      if (d.productType !== "APPOINTMENTS_SERVICE") continue;
      for (const v of d.variations || []) {
        const vd = v.itemVariationData || {};
        const dur =
          vd.serviceDuration != null ? Math.round(Number(vd.serviceDuration) / 60000) + "min" : "?";
        const price = vd.priceMoney ? "$" + (Number(vd.priceMoney.amount) / 100).toFixed(2) : "";
        console.log(
          `${v.id}\tv${v.version}\t${dur}\t${price}\t${d.name}${vd.name ? " / " + vd.name : ""}`
        );
      }
    }
    cursor = result.cursor;
  } while (cursor);

  console.log("\n=== Team member booking profiles ===");
  console.log("teamMemberId\tname");
  const { result: tm } = await client.bookingsApi.listTeamMemberBookingProfiles(
    true, // bookableOnly
    undefined, // limit
    undefined, // cursor
    process.env.SQUARE_LOCATION_ID
  );
  for (const p of tm.teamMemberBookingProfiles || []) {
    console.log(`${p.teamMemberId}\t${p.displayName || ""}`);
  }
  console.log("");
})().catch((e) => {
  console.error(e && e.errors ? e.errors : e);
  process.exit(1);
});
