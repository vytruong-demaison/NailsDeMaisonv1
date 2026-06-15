#!/usr/bin/env node
/* One-off: write real prices onto the existing bookable service variations in
   Square (they were all $0.00). Prices come from the salon's printed brochure.
   Each entry is keyed by the catalog itemVariationId (stable) so a renamed
   service can't get the wrong price. Retrieves each object first so the current
   version + serviceDuration are preserved; only price is changed.

   Usage:  npm run set-prices        (reads .env)
           node scripts/set-prices.js --dry   (preview, no writes)
*/
const crypto = require("crypto");
const { Client, Environment } = require("square");

// Load .env (zero-dep), matching scripts/square-catalog.js.
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
      const val = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch (_) { /* ignore */ }
})();

// itemVariationId -> price in whole dollars (USD). From the salon brochure.
const PRICES = {
  SU2DMKSZ4WDPB5IAV5YHJAQ4: 20,  // Manicure
  "5GVNJZPYJN55S4XSBSF3DX2J": 30, // Deluxe manicure
  FCDBDG5KJYK2VXSTUF6K6LNF: 40,  // Signature manicure
  TVBXDVVPONP2TELAGYHW5YCH: 35,  // Gel manicure
  EF4TMZ563XZCOIM7HO6LUEGL: 45,  // Sns dip
  R6XCNE5T7VX6PQG22NQRBRHC: 55,  // Sns manicure
  JSZHARY75UEF5M5KDQCISPMM: 50,  // Sns w/tips
  HGJAOXG7BRE265I2TZL65SS5: 40,  // Full set
  V5Q7VG3BED3V7ARXVCOQWFB2: 55,  // Gel full set
  "3AIUWV4FUS4WWXN5WBNWSOQE": 60, // Pink & white
  CCGNV36B2JNDOFQKZDEK62RX: 12,  // Eye brow wax
  "7IYJHKM3NFIXZIZSRYBH2FNN": 8,  // Lips wax
  B6L3DPFL3SQAHFIMLW7QTRTM: 18,  // Neck wax
  DLMN35HR3CZOD74O5QOYQXZP: 24,  // Eye brow tint
  ZZIRH2ZLII4TXFESZSWTIP4B: 30,  // Eye brow lamination
  JVKPKFYA4IUNK7IJ6PUHR73U: 80,  // Eyelash extension - classic
  IW2YE54HLVL5UPSKT5GDBQTM: 100, // Eyelash extension - volume
  HSUK2KWGYCFNGT3XKK64FH4P: 120, // Eyelash extension - hybrid
  MHLAFM4HPAK3ED5TSTLLROV2: 30,  // Lash lift
  C5HVHMD4ABRIKSBTED7W3OCG: 35,  // Regular pedicure
  "7CU54EJ3MUTSSII2TIOAOKMB": 45, // Chamomile pedicure
  HRJKXQAOZDVLRVHUBDSGK6SI: 50,  // Chamomile deluxe pedicure
  LCT3QBY5FKVIA573BUNLQBZJ: 55,  // Volcano spa pedicure
  MLRCVY5VAQFBHGRBJE5D43TI: 65,  // Volcano deluxe pedicure
  A5YDBF55YFFZMRYIZCWBTTT5: 70,  // Collagen spa pedicure
  K5SWJXVRE2VPYRYJ4MPDAJPB: 75,  // Collagen deluxe pedicure
  P2R3LQS5KTNPTV4V6PV3CNHB: 15,  // Add in gel
};

const DRY = process.argv.includes("--dry");
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
  console.log(`${DRY ? "[DRY RUN] " : ""}Setting ${Object.keys(PRICES).length} service prices...\n`);

  let ok = 0, fail = 0;
  for (const [id, dollars] of Object.entries(PRICES)) {
    try {
      const { result } = await client.catalogApi.retrieveCatalogObject(id, false);
      const obj = result.object;
      if (!obj || obj.type !== "ITEM_VARIATION") throw new Error("not a variation");
      const vd = obj.itemVariationData || {};
      const was = vd.priceMoney ? "$" + (Number(vd.priceMoney.amount) / 100).toFixed(2) : "(none)";
      const cents = BigInt(dollars * 100);

      if (DRY) {
        console.log(`  ${vd.name ? "" : ""}${id}  ${was} -> $${dollars}.00  (${obj.itemVariationData.name || ""})`);
        ok++;
        continue;
      }

      vd.pricingType = "FIXED_PRICING";
      vd.priceMoney = { amount: cents, currency: "USD" };
      obj.itemVariationData = vd;

      const { result: up } = await client.catalogApi.upsertCatalogObject({
        idempotencyKey: crypto.randomUUID(),
        object: obj,
      });
      const newV = up.catalogObject && up.catalogObject.itemVariationData;
      const now = newV && newV.priceMoney ? "$" + (Number(newV.priceMoney.amount) / 100).toFixed(2) : "?";
      console.log(`  ✓ ${id}  ${was} -> ${now}`);
      ok++;
    } catch (e) {
      const detail = e && e.errors ? JSON.stringify(e.errors) : (e && e.message) || String(e);
      console.log(`  ✗ ${id}  FAILED: ${detail}`);
      fail++;
    }
  }
  console.log(`\nDone. ${ok} ok, ${fail} failed.`);
  if (fail) process.exit(1);
})().catch((e) => {
  console.error(e && e.errors ? e.errors : e);
  process.exit(1);
});
