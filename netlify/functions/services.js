/* GET /api/services
   Returns the salon's bookable services straight from the Square catalog, so
   the frontend never has to hard-code variation IDs/versions. Each entry has
   everything the booking flow needs: serviceVariationId, version, duration,
   and price. */
const { getClient, json, preflight, errorResponse } = require("./_square");

exports.handler = async (event) => {
  const pre = preflight(event);
  if (pre) return pre;
  if (event.httpMethod !== "GET") return json(405, { ok: false, error: "method_not_allowed" });

  try {
    const client = getClient();
    const services = [];
    let cursor;

    do {
      const { result } = await client.catalogApi.searchCatalogObjects({
        objectTypes: ["ITEM"],
        includeRelatedObjects: false,
        limit: 200,
        cursor,
      });

      for (const item of result.objects || []) {
        const data = item.itemData || {};
        // Only appointment services are bookable.
        if (data.productType !== "APPOINTMENTS_SERVICE") continue;

        for (const v of data.variations || []) {
          const vd = v.itemVariationData || {};
          if (vd.availableForBooking === false) continue;
          const durationMs = vd.serviceDuration != null ? Number(vd.serviceDuration) : null;
          const labelExtra = vd.name && vd.name.toLowerCase() !== "regular" ? ` · ${vd.name}` : "";
          services.push({
            name: `${data.name}${labelExtra}`,
            serviceName: data.name,
            variationName: vd.name || null,
            serviceVariationId: v.id,
            serviceVariationVersion: v.version != null ? v.version.toString() : null,
            durationMinutes: durationMs != null ? Math.round(durationMs / 60000) : null,
            price: vd.priceMoney ? Number(vd.priceMoney.amount) / 100 : null,
            currency: vd.priceMoney ? vd.priceMoney.currency : null,
          });
        }
      }
      cursor = result.cursor;
    } while (cursor);

    return json(200, { ok: true, services });
  } catch (err) {
    return errorResponse(err);
  }
};
