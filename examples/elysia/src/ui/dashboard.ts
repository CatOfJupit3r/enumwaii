import {
  courierLabel,
  describeParcelStatus,
  type Parcel,
} from "../domain/parcel";

function renderCheckpointTimeline(parcel: Parcel): string {
  return parcel.checkpoints
    .map(
      (checkpoint) => `
        <li>
          <strong>${checkpoint.at} - ${checkpoint.place}</strong>
          <span>${checkpoint.note}</span>
        </li>`,
    )
    .join("");
}

export function renderDashboard(parcel: Parcel): string {
  const detail = describeParcelStatus(parcel.status);
  const timeline = renderCheckpointTimeline(parcel);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Waybill - Track a parcel</title>
    <style>
      body {
        margin: 0;
        background: #f6f5f0;
        color: #17211b;
        font: 16px system-ui;
      }

      main {
        max-width: 780px;
        margin: auto;
        padding: 44px 20px;
      }

      .brand {
        font-size: 24px;
        font-weight: 800;
        letter-spacing: -0.04em;
      }

      .eyebrow {
        color: #68746d;
        font-size: 12px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      section {
        margin-top: 22px;
        padding: 28px;
        border: 1px solid #dce1d9;
        border-radius: 18px;
        background: white;
        box-shadow: 0 12px 32px #17211b0c;
      }

      .row {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: 20px;
      }

      .pill {
        padding: 7px 12px;
        border-radius: 99px;
        background: #e1f3db;
        color: #1f6126;
        font-size: 13px;
        font-weight: 700;
      }

      .pill[data-color="SLATE"] { background: #e7ebf2; color: #506586; }
      .pill[data-color="BLUE"] { background: #e7efff; color: #285ca8; }
      .pill[data-color="AMBER"] { background: #fff1d5; color: #80540a; }
      .pill[data-color="ROSE"] { background: #fce4e9; color: #a33050; }

      h1 {
        margin: 8px 0;
        font-size: 38px;
        letter-spacing: -0.05em;
      }

      ul {
        margin: 22px 0 0 8px;
        padding: 0;
        border-left: 2px solid #ccdbc9;
        list-style: none;
      }

      li {
        position: relative;
        padding: 0 0 22px 22px;
      }

      li::before {
        position: absolute;
        top: 5px;
        left: -6px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #4b9b57;
        content: "";
      }

      li span {
        display: block;
        margin-top: 4px;
        color: #68746d;
      }

      code {
        padding: 3px 6px;
        border-radius: 5px;
        background: #eff2ed;
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div class="brand">waybill</div>
        <p class="eyebrow">The tracking API of a small courier</p>
      </header>

      <section>
        <div class="row">
          <div>
            <p class="eyebrow">Tracking ${parcel.code}</p>
            <h1>${parcel.route}</h1>
            <p>For ${parcel.recipient} - ${courierLabel(parcel.courier)}</p>
          </div>
          <span class="pill ${detail.slug}" data-color="${detail.color}">${detail.label}</span>
        </div>

        <ul>${timeline}
        </ul>
      </section>

      <section>
        <p class="eyebrow">API notes</p>
        <p>
          Legacy scanner firmware gets a graceful courier fallback at
          <code>/api/parcels/estimate?courier=</code>. Scan events validate
          with Valibot, while enumwaii owns the branded courier value.
        </p>
      </section>
    </main>
  </body>
</html>`;
}
