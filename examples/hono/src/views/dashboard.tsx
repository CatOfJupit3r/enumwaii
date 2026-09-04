import type { FC } from "hono/jsx";

import type { Order } from "../db/order-repository";
import {
  describeOrderStatus,
  getAllowedOrderTransitions,
  ORDER_STATUS,
  ORDER_STATUS_VALUES,
} from "../domain/order-status";

type DashboardProps = {
  readonly orders: readonly Order[];
};

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export const Dashboard: FC<DashboardProps> = ({ orders }) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta
        name="description"
        content="A live Hono, Drizzle, PGlite, and enumwaii order operations example."
      />
      <title>Orderline · enumwaii operations</title>
      <link rel="stylesheet" href="/assets/dashboard.css" />
      <script src="/assets/dashboard.js" defer></script>
    </head>
    <body>
      <header class="shell nav">
        <a class="brand" href="/" aria-label="Orderline dashboard home">
          <span class="brand-mark">E</span>
          <span class="brand-copy">
            <strong>Orderline</strong>
            <span>enumwaii operations console</span>
          </span>
        </a>
        <span class="nav-pill">Hono · Drizzle · local Postgres</span>
      </header>

      <main class="shell">
        <section class="hero">
          <div>
            <span class="eyebrow">Live database workflow</span>
            <h1>Orders that keep their state honest.</h1>
            <p>
              A production-shaped Hono application where Standard Schema guards
              requests, Drizzle persists real rows, and enumwaii restores a
              nominal status brand at every database read.
            </p>
          </div>
          <aside class="hero-aside">
            <strong>Run it without Docker</strong>
            <code>pnpm --dir examples/hono</code>
            <code>dev</code>
            <code>→ http://localhost:3000</code>
          </aside>
        </section>

        <section class="status-grid" aria-label="Order status totals">
          {ORDER_STATUS_VALUES.map((status) => {
            const presentation = describeOrderStatus(status);
            const count = orders.filter(
              (order) => order.status === status,
            ).length;
            return (
              <article class={`status-card ${presentation.tone}`}>
                <div class="status-top">
                  <span class="status-label">{presentation.label}</span>
                  <span class="dot" aria-hidden="true"></span>
                </div>
                <div class="status-count">{count}</div>
                <div class="status-detail">{presentation.description}</div>
              </article>
            );
          })}
        </section>

        <section class="workbench">
          <div class="panel">
            <div class="panel-head">
              <div>
                <h2>Order queue</h2>
                <p>
                  Every transition writes through an optimistic version check.
                </p>
              </div>
              <span class="method">GET /api/orders</span>
            </div>
            <div class="order-list">
              {orders.length === 0 ? (
                <div class="empty">No orders yet. Create the first one.</div>
              ) : (
                orders.map((order) => {
                  const presentation = describeOrderStatus(order.status);
                  const suggested =
                    getAllowedOrderTransitions(order.status)[0] ??
                    ORDER_STATUS.PENDING;
                  return (
                    <article class="order">
                      <div>
                        <div class="order-title">
                          <strong>{order.memo ?? "Untitled order"}</strong>
                          <span class={`badge ${presentation.tone}`}>
                            {presentation.label}
                          </span>
                        </div>
                        <p>{presentation.description}</p>
                        <span class="order-meta">
                          {order.id} · v{order.version} · updated{" "}
                          {formatTimestamp(order.updatedAt)}
                        </span>
                      </div>
                      <form
                        class="transition-form"
                        data-endpoint={`/api/orders/${order.id}/transition`}
                      >
                        <select
                          name="to"
                          aria-label={`Target status for ${order.id}`}
                        >
                          {ORDER_STATUS_VALUES.map((status) => (
                            <option
                              value={status}
                              selected={status === suggested}
                            >
                              {describeOrderStatus(status).label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          name="expectedVersion"
                          value={order.version}
                          aria-label={`Expected version for ${order.id}`}
                        />
                        <button type="submit">Move</button>
                      </form>
                    </article>
                  );
                })
              )}
            </div>
          </div>

          <div class="stack">
            <section class="panel">
              <div class="panel-head">
                <div>
                  <h2>Create an order</h2>
                  <p>Leave status blank to exercise the PostgreSQL default.</p>
                </div>
                <span class="method">POST</span>
              </div>
              <form class="form-body" id="create-order">
                <label>
                  Operations memo
                  <input
                    name="memo"
                    maxLength={180}
                    placeholder="e.g. Pack with reusable insulation"
                  />
                </label>
                <label>
                  Initial status
                  <select name="status">
                    <option value="">Database default · Pending</option>
                    {ORDER_STATUS_VALUES.map((status) => (
                      <option value={status}>
                        {describeOrderStatus(status).label}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="submit">Create persisted order</button>
              </form>
            </section>

            <section class="panel">
              <div class="panel-head">
                <div>
                  <h2>Boundary lab</h2>
                  <p>Send raw inputs and inspect the real HTTP response.</p>
                </div>
                <span class="method">Standard Schema</span>
              </div>
              <div class="lab">
                <div class="lab-grid">
                  <button
                    class="button-secondary"
                    data-boundary-body={'"PAID"'}
                  >
                    Valid member
                  </button>
                  <button
                    class="button-secondary button-danger"
                    data-boundary-body={'"REFUNDED"'}
                  >
                    Unknown member
                  </button>
                  <button
                    class="button-secondary button-danger"
                    data-boundary-body="42"
                  >
                    Wrong primitive
                  </button>
                  <button
                    class="button-secondary"
                    data-boundary-url="/api/status"
                  >
                    Nil → default
                  </button>
                  <button
                    class="button-secondary button-danger"
                    data-boundary-url="/api/status?status=REFUNDED"
                  >
                    Malformed query
                  </button>
                  <button
                    class="button-secondary"
                    data-boundary-url="/api/orders"
                  >
                    Refresh JSON
                  </button>
                </div>
                <pre class="output" id="api-output" aria-live="polite">
                  Choose a boundary case. Responses appear here.
                </pre>
              </div>
            </section>

            <aside class="panel policy">
              <strong>Corrupt row policy</strong>
              <p>
                PostgreSQL rejects new values outside its enum. On reads,
                <code> hydrateOrder </code> still parses unknown driver output
                strictly; schema drift or a historical value stops the normal
                path instead of receiving a silent fallback.
              </p>
            </aside>
          </div>
        </section>
      </main>

      <footer class="shell footer">
        <span>enumwaii · nominal values across HTTP and SQL boundaries</span>
        <span>PGlite data stays local in examples/hono/.data</span>
      </footer>
    </body>
  </html>
);
