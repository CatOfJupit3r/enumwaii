import { em } from "enumwaii";

const noticeTones = em(["SUCCESS", "ERROR"]);
const NOTICE_TONE = noticeTones.enum;

export const DASHBOARD_CSS = String.raw`
:root {
  color-scheme: dark;
  --ink: #f5f7ef;
  --muted: #9ba6a0;
  --panel: rgba(20, 27, 25, 0.76);
  --line: rgba(220, 237, 226, 0.12);
  --lime: #c8ff73;
  --lime-ink: #17220d;
  --amber: #ffca68;
  --blue: #81bcff;
  --green: #72e2a8;
  --slate: #a7b1ad;
  --danger: #ff8b7e;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #0a100e;
  color: var(--ink);
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  min-width: 320px;
  margin: 0;
  background:
    radial-gradient(circle at 82% 4%, rgba(103, 154, 112, 0.2), transparent 30rem),
    radial-gradient(circle at 8% 32%, rgba(200, 255, 115, 0.08), transparent 24rem),
    #0a100e;
}
button, input, select { font: inherit; }
button, a { -webkit-tap-highlight-color: transparent; }
code { font-family: "SFMono-Regular", Consolas, monospace; }
.shell { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
.nav { display: flex; align-items: center; justify-content: space-between; min-height: 72px; border-bottom: 1px solid var(--line); }
.brand { display: flex; align-items: center; gap: 12px; color: var(--ink); text-decoration: none; }
.brand-mark { display: grid; width: 34px; height: 34px; place-items: center; border: 1px solid rgba(200, 255, 115, 0.38); border-radius: 10px; background: rgba(200, 255, 115, 0.1); color: var(--lime); font-weight: 900; }
.brand-copy { display: grid; gap: 1px; }
.brand-copy strong { font-size: 14px; letter-spacing: 0.02em; }
.brand-copy span { color: var(--muted); font-size: 11px; }
.nav-pill, .eyebrow, .method { border: 1px solid var(--line); border-radius: 999px; color: var(--muted); font-size: 11px; font-weight: 750; letter-spacing: 0.08em; text-transform: uppercase; }
.nav-pill { padding: 8px 11px; }
.hero { display: grid; grid-template-columns: 1.55fr 0.8fr; gap: 42px; padding: 72px 0 52px; }
.eyebrow { display: inline-flex; padding: 7px 10px; color: var(--lime); }
h1 { max-width: 760px; margin: 20px 0 18px; font-size: clamp(42px, 7vw, 78px); line-height: 0.95; letter-spacing: -0.06em; }
.hero p { max-width: 690px; margin: 0; color: var(--muted); font-size: clamp(16px, 2vw, 20px); line-height: 1.65; }
.hero-aside { align-self: end; padding: 24px; border: 1px solid var(--line); border-radius: 22px; background: linear-gradient(145deg, rgba(200, 255, 115, 0.1), rgba(20, 27, 25, 0.85)); }
.hero-aside strong { display: block; margin-bottom: 12px; font-size: 14px; }
.hero-aside code { display: block; color: var(--lime); font-size: 13px; line-height: 1.8; }
.status-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 48px; }
.status-card { position: relative; overflow: hidden; min-height: 142px; padding: 20px; border: 1px solid var(--line); border-radius: 18px; background: var(--panel); }
.status-card::after { position: absolute; right: -20px; bottom: -30px; width: 90px; height: 90px; border-radius: 999px; background: currentColor; content: ""; filter: blur(42px); opacity: 0.25; }
.status-card.amber { color: var(--amber); }
.status-card.blue { color: var(--blue); }
.status-card.green { color: var(--green); }
.status-card.slate { color: var(--slate); }
.status-card.rose { color: var(--danger); }
.status-top { display: flex; align-items: center; justify-content: space-between; }
.status-label { color: var(--muted); font-size: 12px; font-weight: 750; letter-spacing: 0.08em; text-transform: uppercase; }
.status-count { margin-top: 16px; color: var(--ink); font-size: 38px; font-weight: 780; letter-spacing: -0.04em; }
.status-detail { margin-top: 5px; color: var(--muted); font-size: 12px; }
.dot { width: 8px; height: 8px; border-radius: 999px; background: currentColor; box-shadow: 0 0 16px currentColor; }
.workbench { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.72fr); gap: 20px; align-items: start; padding-bottom: 64px; }
.stack { display: grid; gap: 20px; }
.panel { border: 1px solid var(--line); border-radius: 22px; background: var(--panel); backdrop-filter: blur(18px); }
.panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; padding: 22px 24px; border-bottom: 1px solid var(--line); }
.panel-head h2 { margin: 0 0 6px; font-size: 18px; letter-spacing: -0.02em; }
.panel-head p { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.5; }
.method { flex: 0 0 auto; padding: 6px 8px; color: var(--blue); }
.order-list { display: grid; }
.empty { padding: 44px 24px; color: var(--muted); text-align: center; }
.order { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 20px; padding: 22px 24px; border-bottom: 1px solid var(--line); }
.order:last-child { border-bottom: 0; }
.order-title { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
.order-title strong { font-size: 15px; }
.badge { padding: 5px 8px; border: 1px solid currentColor; border-radius: 999px; font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.92; }
.badge.amber { color: var(--amber); background: rgba(255, 202, 104, 0.08); }
.badge.blue { color: var(--blue); background: rgba(129, 188, 255, 0.08); }
.badge.green { color: var(--green); background: rgba(114, 226, 168, 0.08); }
.badge.slate { color: var(--slate); background: rgba(167, 177, 173, 0.08); }
.badge.rose { color: var(--danger); background: rgba(255, 139, 126, 0.08); }
.order p { margin: 10px 0 8px; color: var(--muted); font-size: 13px; }
.order-meta { color: #718078; font-size: 11px; }
.transition-form { display: grid; grid-template-columns: 110px 72px auto; gap: 7px; align-self: center; }
.form-body { display: grid; gap: 14px; padding: 24px; }
label { display: grid; gap: 7px; color: var(--muted); font-size: 12px; font-weight: 650; }
input, select { width: 100%; min-height: 42px; padding: 9px 11px; border: 1px solid var(--line); border-radius: 10px; outline: none; background: #0d1512; color: var(--ink); }
input:focus, select:focus { border-color: rgba(200, 255, 115, 0.62); box-shadow: 0 0 0 3px rgba(200, 255, 115, 0.08); }
button { min-height: 42px; padding: 9px 14px; border: 0; border-radius: 10px; cursor: pointer; background: var(--lime); color: var(--lime-ink); font-weight: 800; transition: transform 140ms ease, filter 140ms ease; }
button:hover { filter: brightness(1.06); transform: translateY(-1px); }
button:disabled { cursor: wait; filter: grayscale(0.7); opacity: 0.65; transform: none; }
.request-toast { position: fixed; right: 20px; bottom: 20px; z-index: 10; max-width: min(420px, calc(100vw - 40px)); padding: 13px 16px; border: 1px solid rgba(200, 255, 115, 0.42); border-radius: 12px; background: #152019; box-shadow: 0 18px 48px rgba(0, 0, 0, 0.35); color: var(--ink); font-size: 13px; font-weight: 700; line-height: 1.45; }
.request-toast[data-tone="ERROR"] { border-color: rgba(255, 139, 126, 0.52); background: #2a1715; color: #ffd3cc; }
.request-toast[data-tone="SUCCESS"] { color: #d9ffad; }
.policy { padding: 22px 24px; }
.policy strong { display: block; margin-bottom: 9px; }
.policy p { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.65; }
.policy code { color: var(--amber); }
.footer { display: flex; justify-content: space-between; gap: 20px; padding: 26px 0 42px; border-top: 1px solid var(--line); color: #718078; font-size: 11px; }
@media (max-width: 900px) {
  .hero, .workbench { grid-template-columns: 1fr; }
  .hero { gap: 28px; padding-top: 52px; }
  .status-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 620px) {
  .shell { width: min(100% - 20px, 1180px); }
  .nav-pill { display: none; }
  .hero { padding: 42px 4px 34px; }
  .status-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
  .status-card { min-height: 124px; padding: 16px; }
  .order { grid-template-columns: 1fr; padding: 19px 17px; }
  .transition-form { grid-template-columns: minmax(0, 1fr) 68px auto; }
  .panel-head { padding: 19px 17px; }
  .form-body, .policy { padding: 19px 17px; }
  .footer { flex-direction: column; }
}
`;

export const DASHBOARD_SCRIPT = String.raw`
(() => {
  const NOTICE_TONE = ${JSON.stringify(NOTICE_TONE)};
  const toast = document.querySelector("#request-toast");
  const show = (message, tone = NOTICE_TONE.SUCCESS) => {
    if (!toast) return;
    toast.hidden = false;
    toast.dataset.tone = tone;
    toast.textContent = message;
  };
  const send = async (url, options, successMessage) => {
    const response = await fetch(url, options);
    const payload = await response.json().catch(() => ({}));
    if (response.ok) {
      show(successMessage, NOTICE_TONE.SUCCESS);
    } else {
      show(payload.error || "Counter could not complete that request.", NOTICE_TONE.ERROR);
    }
    return response.ok;
  };
  const withBusyButton = async (button, operation) => {
    button.disabled = true;
    try {
      const ok = await operation();
      if (ok) window.setTimeout(() => window.location.reload(), 850);
    } catch (error) {
      show("Counter could not reach the order board. Try again.", "error");
    } finally {
      button.disabled = false;
    }
  };
  document.querySelector("#create-order")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector("button[type=submit]");
    const data = new FormData(form);
    const body = { drink: data.get("drink"), size: data.get("size"), note: data.get("note") };
    withBusyButton(button, () => send("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }, "Order added to the board. Refreshing…"));
  });
  document.querySelectorAll(".transition-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const button = form.querySelector("button[type=submit]");
      const data = new FormData(form);
      withBusyButton(button, () => send(form.dataset.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: data.get("to"),
          expectedVersion: Number(data.get("expectedVersion")),
        }),
      }, "Cup moved. Refreshing the board…"));
    });
  });
})();
`;
