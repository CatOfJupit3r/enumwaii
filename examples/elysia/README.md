# Waybill — Elysia + enumwaii

Waybill is the tracking API of a small courier, with a public “where’s my package?” page. Run it with `pnpm --dir examples/elysia dev`, then open <http://localhost:3000/track/WB-48291>.

The seeded parcel travels Rotterdam → Lisbon and renders a real checkpoint timeline. The API illustrates three distinct boundary decisions:

- `GET /api/parcels?status=` uses a nil-only `default` for a missing filter; unknown filters are errors.
- `GET /api/parcels/estimate?courier=` uses `fallback` to `STANDARD` for legacy scanner firmware.
- `POST /api/parcels/:code/scan` accepts a Valibot object schema whose `courier` field comes from `valibotSchema(enumwaiiEnum)`.

`ParcelStatus` and `Courier` use object-form enums: named keys such as `OUT_FOR_DELIVERY` map to canonical wire values such as `out-for-delivery`. Routes parse those exact values; no casing conversion is needed. `.derive()` supplies labels and enumwaii-owned pill colors, and `couriers.derive(uppercase)` supplies the courier display label.

```sh
pnpm --dir examples/elysia test
pnpm --dir examples/elysia test:types
pnpm --dir examples/elysia build
```
