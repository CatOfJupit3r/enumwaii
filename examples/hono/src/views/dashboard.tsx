import type { FC } from "hono/jsx";
import type { Order } from "../db/order-repository";
import {
  describeDrinkSize,
  describeOrderStatus,
  toneClasses,
  getAllowedOrderTransitions,
  ORDER_STATUS_VALUES,
  DRINK_SIZE_VALUES,
  type OrderStatus,
} from "../domain/order-status";

type DashboardProps = {
  readonly orders: readonly Order[];
  readonly filter?: OrderStatus;
  readonly fallback: boolean;
};
export const Dashboard: FC<DashboardProps> = ({ orders, filter, fallback }) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Counter · café order board</title>
      <link rel="stylesheet" href="/assets/dashboard.css" />
      <script src="/assets/dashboard.js" defer />
    </head>
    <body>
      <header class="shell nav">
        <a class="brand" href="/">
          <span class="brand-mark">C</span>
          <span class="brand-copy">
            <strong>Counter</strong>
            <span>the barista-facing order board</span>
          </span>
        </a>
        <span class="nav-pill">Hono · Drizzle · local Postgres</span>
      </header>
      <main class="shell">
        <div
          id="request-toast"
          class="request-toast"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          hidden
        />
        <section class="hero">
          <div>
            <span class="eyebrow">Today at Counter</span>
            <h1>Coffee orders, right where the barista needs them.</h1>
            <p>
              Every card is a real Postgres row. Its allowed next move is an
              exhaustive enumwaii transition graph, protected by an optimistic
              version.
            </p>
          </div>
          <aside class="hero-aside">
            <strong>Start serving</strong>
            <code>pnpm --dir examples/hono dev</code>
            <code>→ http://localhost:3000</code>
          </aside>
        </section>
        {fallback ? (
          <aside class="panel policy">
            <strong>We did not recognize that status filter.</strong>
            <p>Your shared deep link now shows ready drinks instead.</p>
          </aside>
        ) : null}
        <section class="status-grid" aria-label="Café order columns">
          {ORDER_STATUS_VALUES.map((status) => {
            const detail = describeOrderStatus(status);
            const visible = orders.filter((order) => order.status === status);
            return (
              <article class={`status-card ${toneClasses.get(detail.tone)}`}>
                <div class="status-top">
                  <span class="status-label">{detail.label}</span>
                  <span class="dot" />
                </div>
                <div class="status-count">{visible.length}</div>
                <div class="status-detail">{detail.description}</div>
              </article>
            );
          })}
        </section>
        <section class="workbench">
          <div class="panel">
            <div class="panel-head">
              <div>
                <h2>
                  Order board{" "}
                  {filter === undefined
                    ? ""
                    : `· ${describeOrderStatus(filter).label}`}
                </h2>
                <p>
                  Move a card forward, or let a stale version show the other
                  barista’s update.
                </p>
              </div>
              <span class="method">GET /api/orders</span>
            </div>
            <div class="order-list">
              {orders.length === 0 ? (
                <div class="empty">No cards match this view.</div>
              ) : (
                orders.map((order) => {
                  const detail = describeOrderStatus(order.status);
                  const options = getAllowedOrderTransitions(order.status);
                  return (
                    <article class="order">
                      <div>
                        <div class="order-title">
                          <strong>
                            {order.drink} ·{" "}
                            {describeDrinkSize(order.size).label}
                          </strong>
                          <span class={`badge ${toneClasses.get(detail.tone)}`}>
                            {detail.label}
                          </span>
                        </div>
                        <p>{order.note ?? "No barista note"}</p>
                        <span class="order-meta">
                          {order.id} · $
                          {(describeDrinkSize(order.size).cents / 100).toFixed(
                            2,
                          )}{" "}
                          · v{order.version}
                        </span>
                      </div>
                      <form
                        class="transition-form"
                        data-endpoint={`/api/orders/${order.id}/transition`}
                      >
                        <select name="to" aria-label={`Move ${order.id}`}>
                          {options.map((status) => (
                            <option value={status}>
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
                        <button type="submit" disabled={options.length === 0}>
                          Move cup
                        </button>
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
                  <h2>New café order</h2>
                  <p>
                    Choose from enum-owned drink sizes. Leaving status blank
                    uses the canonical PostgreSQL default.
                  </p>
                </div>
                <span class="method">POST</span>
              </div>
              <form class="form-body" id="create-order">
                <label>
                  Drink
                  <input
                    name="drink"
                    required
                    maxLength={180}
                    placeholder="e.g. Cardamom latte"
                  />
                </label>
                <label>
                  Size
                  <select name="size">
                    {DRINK_SIZE_VALUES.map((size) => (
                      <option value={size}>
                        {describeDrinkSize(size).label} · $
                        {(describeDrinkSize(size).cents / 100).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Barista note
                  <input
                    name="note"
                    maxLength={180}
                    placeholder="e.g. Oat milk, extra hot"
                  />
                </label>
                <button type="submit">Add to board</button>
              </form>
            </section>
            <aside class="panel policy">
              <strong>Migration safety</strong>
              <p>
                If an old or corrupt row reaches the app,{" "}
                <code>hydrateOrder</code> strictly parses status and drink size.
                It says “a migration went wrong” instead of silently putting a
                cup in the wrong column.
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
