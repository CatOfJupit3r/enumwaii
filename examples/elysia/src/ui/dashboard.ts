export function renderDashboard(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <title>Theme Boundary Console · Elysia + enumwaii</title>
    <style>
      :root {
        color-scheme: dark;
        --ink: #f6f3ea;
        --muted: #a9aea8;
        --canvas: #0a0c0c;
        --surface: #121515;
        --line: rgba(255, 255, 255, 0.1);
        --acid: #c9ff5f;
        --coral: #ff8066;
        --violet: #a892ff;
        --sky: #6dd5fa;
        --radius: 20px;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
          "Segoe UI", sans-serif;
      }

      * { box-sizing: border-box; }

      body {
        min-width: 320px;
        margin: 0;
        color: var(--ink);
        background:
          radial-gradient(circle at 82% -10%, rgba(168, 146, 255, 0.2), transparent 32rem),
          radial-gradient(circle at -10% 35%, rgba(201, 255, 95, 0.1), transparent 30rem),
          var(--canvas);
      }

      button, select, input { font: inherit; }
      button { cursor: pointer; }

      button:focus-visible,
      select:focus-visible,
      input:focus-visible {
        outline: 2px solid var(--acid);
        outline-offset: 3px;
      }

      code, pre, .eyebrow, .method, .status-pill {
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
      }

      .page {
        width: min(1440px, calc(100% - 32px));
        margin: 0 auto;
        padding: 24px 0 64px;
      }

      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        padding: 8px 2px 26px;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 14px;
        font-weight: 760;
      }

      .brand-mark {
        display: grid;
        width: 34px;
        height: 34px;
        place-items: center;
        border: 1px solid rgba(201, 255, 95, 0.45);
        border-radius: 10px;
        color: var(--acid);
        background: rgba(201, 255, 95, 0.08);
      }

      .runtime {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--muted);
        font-size: 13px;
      }

      .runtime-dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--acid);
        box-shadow: 0 0 14px rgba(201, 255, 95, 0.8);
      }

      .hero {
        position: relative;
        overflow: hidden;
        display: grid;
        grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
        gap: 32px;
        padding: clamp(28px, 5vw, 64px);
        border: 1px solid var(--line);
        border-radius: 30px;
        background: linear-gradient(135deg, rgba(24, 28, 27, 0.98), rgba(14, 16, 16, 0.94));
        box-shadow: 0 30px 90px rgba(0, 0, 0, 0.32);
      }

      .hero::after {
        position: absolute;
        right: -130px;
        bottom: -190px;
        width: 420px;
        height: 420px;
        border: 70px solid rgba(255, 128, 102, 0.08);
        border-radius: 50%;
        content: "";
      }

      .hero-copy, .theme-preview { position: relative; z-index: 1; }

      .eyebrow {
        margin: 0 0 16px;
        color: var(--acid);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      h1 {
        max-width: 780px;
        margin: 0;
        font-size: clamp(44px, 7vw, 92px);
        font-weight: 780;
        line-height: 0.92;
        letter-spacing: -0.065em;
      }

      h1 span { color: var(--acid); }

      .lede {
        max-width: 680px;
        margin: 24px 0 0;
        color: #c6cbc5;
        font-size: clamp(16px, 2vw, 20px);
        line-height: 1.6;
      }

      .signal-row {
        display: flex;
        flex-wrap: wrap;
        gap: 9px;
        margin-top: 30px;
      }

      .signal {
        padding: 8px 11px;
        border: 1px solid var(--line);
        border-radius: 999px;
        color: #cbd0ca;
        background: rgba(255, 255, 255, 0.035);
        font-size: 12px;
      }

      .theme-preview {
        align-self: stretch;
        display: flex;
        min-height: 310px;
        flex-direction: column;
        justify-content: space-between;
        padding: 24px;
        border: 1px solid rgba(255, 255, 255, 0.13);
        border-radius: 24px;
        background: linear-gradient(145deg, rgba(168, 146, 255, 0.22), transparent 52%), #0d0f0f;
      }

      .preview-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: var(--muted);
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .preview-swatch {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--violet);
        box-shadow: 0 0 20px rgba(168, 146, 255, 0.75);
      }

      .preview-value {
        margin: auto 0 4px;
        font-size: clamp(40px, 5vw, 70px);
        font-weight: 760;
        letter-spacing: -0.06em;
      }

      .preview-meta {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        color: var(--muted);
        font-size: 13px;
      }

      .workspace {
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
        gap: 18px;
        margin-top: 18px;
      }

      .labs { display: grid; gap: 18px; }

      .panel {
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: rgba(18, 21, 21, 0.92);
      }

      .lab { padding: 24px; }

      .lab-heading {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 18px;
      }

      .lab h2, .console h2 {
        margin: 0;
        font-size: 20px;
        letter-spacing: -0.025em;
      }

      .lab p {
        max-width: 720px;
        margin: 8px 0 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.55;
      }

      .method {
        flex: 0 0 auto;
        padding: 6px 9px;
        border-radius: 8px;
        color: #090b0a;
        background: var(--acid);
        font-size: 11px;
        font-weight: 800;
      }

      .method.get { background: var(--sky); }

      .route {
        display: block;
        margin-top: 12px;
        color: #dfe3de;
        font-size: 12px;
      }

      .control-row {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        gap: 10px;
        margin-top: 20px;
      }

      select, input {
        display: block;
        min-height: 42px;
        padding: 0 12px;
        border: 1px solid var(--line);
        border-radius: 11px;
        color: var(--ink);
        background: #0c0f0e;
      }

      select { min-width: 150px; }
      input { min-width: min(220px, 100%); }

      .control-row .eyebrow {
        display: block;
        margin-bottom: 7px;
        color: var(--muted);
        font-size: 10px;
      }

      .action {
        min-height: 42px;
        padding: 0 15px;
        border: 1px solid rgba(201, 255, 95, 0.35);
        border-radius: 11px;
        color: var(--acid);
        background: rgba(201, 255, 95, 0.07);
        font-weight: 700;
        transition: transform 150ms ease, border-color 150ms ease, background 150ms ease;
      }

      .action:hover {
        transform: translateY(-1px);
        border-color: rgba(201, 255, 95, 0.72);
        background: rgba(201, 255, 95, 0.12);
      }

      .action.secondary {
        border-color: var(--line);
        color: #d8dcd7;
        background: rgba(255, 255, 255, 0.035);
      }

      .action.danger {
        border-color: rgba(255, 128, 102, 0.38);
        color: var(--coral);
        background: rgba(255, 128, 102, 0.07);
      }

      .console {
        position: sticky;
        top: 18px;
        overflow: hidden;
        height: max-content;
      }

      .console-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 22px 22px 18px;
        border-bottom: 1px solid var(--line);
      }

      .status-pill {
        padding: 6px 9px;
        border: 1px solid var(--line);
        border-radius: 999px;
        color: var(--muted);
        font-size: 11px;
      }

      .status-pill.ok { border-color: rgba(201, 255, 95, 0.36); color: var(--acid); }
      .status-pill.error { border-color: rgba(255, 128, 102, 0.4); color: var(--coral); }

      .request-line {
        min-height: 56px;
        padding: 18px 22px;
        border-bottom: 1px solid var(--line);
        color: #bec4bd;
        font: 12px/1.6 "SFMono-Regular", Consolas, monospace;
        overflow-wrap: anywhere;
      }

      pre {
        min-height: 360px;
        max-height: 620px;
        margin: 0;
        padding: 22px;
        overflow: auto;
        color: #e8ece6;
        font-size: 13px;
        line-height: 1.65;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .console-foot {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        padding: 14px 22px;
        border-top: 1px solid var(--line);
        color: var(--muted);
        font-size: 11px;
      }

      .principles {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1px;
        margin-top: 18px;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: var(--line);
      }

      .principle { padding: 22px; background: var(--surface); }
      .principle strong { display: block; margin-bottom: 8px; font-size: 14px; }
      .principle span { color: var(--muted); font-size: 13px; line-height: 1.5; }

      @media (max-width: 980px) {
        .hero, .workspace { grid-template-columns: 1fr; }
        .theme-preview { min-height: 230px; }
        .console { position: static; }
        .principles { grid-template-columns: 1fr; }
      }

      @media (max-width: 620px) {
        .page { width: min(100% - 20px, 1440px); padding-top: 12px; }
        .topbar { padding-bottom: 16px; }
        .runtime span:last-child { display: none; }
        .hero { gap: 24px; padding: 26px 20px; border-radius: 22px; }
        h1 { font-size: clamp(42px, 15vw, 64px); }
        .lab, .console-head, .request-line, pre { padding-right: 18px; padding-left: 18px; }
        .lab-heading { flex-direction: column-reverse; gap: 10px; }
        .control-row > * { width: 100%; }
        .console-foot { flex-direction: column; }
      }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <header class="topbar">
        <div class="brand"><span class="brand-mark">EW</span><span>enumwaii / Elysia</span></div>
        <div class="runtime"><span class="runtime-dot" aria-hidden="true"></span><span>Node adapter · live playground</span></div>
      </header>

      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">Theme preference service / boundary console</p>
          <h1>Make invalid states <span>visible.</span></h1>
          <p class="lede">Exercise a real Elysia plugin where Standard Schema, branded domain values, and transport objects meet. Every control below calls the running API and shows the exact HTTP contract.</p>
          <div class="signal-row" aria-label="Implementation highlights">
            <span class="signal">Elysia 1.4</span><span class="signal">Standard Schema v1</span><span class="signal">branded domain values</span><span class="signal">Node runtime adapter</span>
          </div>
        </div>
        <aside class="theme-preview" aria-label="Latest valid theme">
          <div class="preview-header"><span>Latest accepted theme</span><span class="preview-swatch" aria-hidden="true"></span></div>
          <div class="preview-value" id="preview-theme">DARK</div>
          <div class="preview-meta"><span id="preview-label">Dark theme</span><span id="preview-class">theme-dark</span></div>
        </aside>
      </section>

      <section class="workspace" aria-label="API playground">
        <div class="labs">
          <article class="panel lab">
            <div class="lab-heading">
              <div><h2>Scalar request boundary</h2><code class="route">/v1/themes/selection</code><p>The enumwaii declaration is supplied directly as Elysia's body schema. Try a valid JSON scalar, the wrong primitive, or the same valid value with a text media type.</p></div>
              <span class="method">POST</span>
            </div>
            <div class="control-row">
              <label><span class="eyebrow">Theme</span><select id="selection-theme"><option>LIGHT</option><option selected>DARK</option><option>SYSTEM</option><option>NEON</option></select></label>
              <button class="action" id="run-selection">Send JSON scalar</button>
              <button class="action danger" id="run-wrong-type">Send number 42</button>
              <button class="action secondary" id="run-text-body">Send text/plain</button>
            </div>
          </article>

          <article class="panel lab">
            <div class="lab-heading">
              <div><h2>Object-shaped params</h2><code class="route">/v1/themes/lookup/:theme</code><p>Elysia validates the params object; the route then extracts one scalar and parses it before branded domain logic runs.</p></div>
              <span class="method get">GET</span>
            </div>
            <div class="control-row">
              <label><span class="eyebrow">Path value</span><input id="lookup-theme" value="LIGHT" autocomplete="off" /></label>
              <button class="action" id="run-lookup">Look up theme</button>
              <button class="action danger" id="run-bad-lookup">Look up NEON</button>
            </div>
          </article>

          <article class="panel lab">
            <div class="lab-heading">
              <div><h2>Absence versus malformed input</h2><code class="route">/v1/themes/preference · /recommendation</code><p>A default handles only a missing value. A fallback recovers from any invalid input. Compare the same malformed value across both policies.</p></div>
              <span class="method get">GET</span>
            </div>
            <div class="control-row">
              <button class="action" id="run-default">Missing → default</button>
              <button class="action danger" id="run-strict">NEON → strict error</button>
              <button class="action secondary" id="run-fallback">NEON → fallback</button>
            </div>
          </article>

          <article class="panel lab">
            <div class="lab-heading">
              <div><h2>Scalar response boundary</h2><code class="route">/v1/themes/current</code><p>The handler returns a branded domain member and Elysia checks it with the same enumwaii Standard Schema on the way out.</p></div>
              <span class="method get">GET</span>
            </div>
            <div class="control-row"><button class="action" id="run-current">Read current theme</button></div>
          </article>
        </div>

        <aside class="panel console" aria-label="HTTP response inspector">
          <div class="console-head"><h2>Response inspector</h2><span class="status-pill" id="response-status">READY</span></div>
          <div class="request-line" id="request-line">Choose an operation to send a real request.</div>
          <pre id="response-body" aria-live="polite">{
  "hint": "Start with Send JSON scalar"
}</pre>
          <div class="console-foot"><span id="response-type">No response yet</span><span id="response-time">— ms</span></div>
        </aside>
      </section>

      <section class="principles" aria-label="Boundary principles">
        <div class="principle"><strong>Validate the real shape</strong><span>Scalar schemas validate scalars; Elysia object schemas own query and params structure.</span></div>
        <div class="principle"><strong>Brand before domain logic</strong><span>The explicit second parse bridges Elysia 1.4's handler inference without a cast.</span></div>
        <div class="principle"><strong>Keep recovery intentional</strong><span>Default means absent. Fallback means invalid. The API reports which policy resolved a value.</span></div>
      </section>
    </main>

    <script>
      const statusNode = document.querySelector("#response-status");
      const requestNode = document.querySelector("#request-line");
      const bodyNode = document.querySelector("#response-body");
      const typeNode = document.querySelector("#response-type");
      const timeNode = document.querySelector("#response-time");
      const previewTheme = document.querySelector("#preview-theme");
      const previewLabel = document.querySelector("#preview-label");
      const previewClass = document.querySelector("#preview-class");

      function formatBody(rawBody, contentType) {
        if (!rawBody) return "(empty response)";
        if (!contentType.includes("application/json")) return rawBody;
        try { return JSON.stringify(JSON.parse(rawBody), null, 2); }
        catch { return rawBody; }
      }

      function updatePreview(rawBody, contentType) {
        if (!contentType.includes("application/json")) {
          if (["LIGHT", "DARK", "SYSTEM"].includes(rawBody)) {
            previewTheme.textContent = rawBody;
            previewLabel.textContent = "Validated scalar response";
            previewClass.textContent = "response-schema";
          }
          return;
        }
        try {
          const payload = JSON.parse(rawBody);
          if (!payload.theme) return;
          previewTheme.textContent = payload.theme;
          previewLabel.textContent = payload.label || "Accepted theme";
          previewClass.textContent = payload.cssClass || "enumwaii member";
        } catch { /* The inspector already shows malformed JSON verbatim. */ }
      }

      async function invoke(options) {
        statusNode.className = "status-pill";
        statusNode.textContent = "RUNNING";
        requestNode.textContent = options.method + " " + options.path;
        bodyNode.textContent = "Waiting for the service…";
        typeNode.textContent = options.contentType || "No request body";
        timeNode.textContent = "— ms";
        const init = { method: options.method };
        if (options.body !== undefined) {
          init.headers = { "Content-Type": options.contentType };
          init.body = options.encoding === "json" ? JSON.stringify(options.body) : options.body;
        }
        const started = performance.now();
        try {
          const response = await fetch(options.path, init);
          const elapsed = Math.round(performance.now() - started);
          const contentType = response.headers.get("content-type") || "unknown content type";
          const rawBody = await response.text();
          statusNode.textContent = String(response.status);
          statusNode.className = "status-pill " + (response.ok ? "ok" : "error");
          bodyNode.textContent = formatBody(rawBody, contentType);
          typeNode.textContent = contentType;
          timeNode.textContent = elapsed + " ms";
          if (response.ok) updatePreview(rawBody, contentType);
        } catch (error) {
          statusNode.textContent = "NETWORK";
          statusNode.className = "status-pill error";
          bodyNode.textContent = error instanceof Error ? error.message : String(error);
          typeNode.textContent = "Request failed";
          timeNode.textContent = Math.round(performance.now() - started) + " ms";
        }
      }

      function onClick(selector, handler) {
        document.querySelector(selector).addEventListener("click", handler);
      }

      onClick("#run-selection", () => {
        const theme = document.querySelector("#selection-theme").value;
        void invoke({ method: "POST", path: "/v1/themes/selection", body: theme, contentType: "application/json", encoding: "json" });
      });
      onClick("#run-wrong-type", () => void invoke({ method: "POST", path: "/v1/themes/selection", body: 42, contentType: "application/json", encoding: "json" }));
      onClick("#run-text-body", () => void invoke({ method: "POST", path: "/v1/themes/selection", body: "DARK", contentType: "text/plain", encoding: "text" }));
      onClick("#run-lookup", () => {
        const theme = document.querySelector("#lookup-theme").value;
        void invoke({ method: "GET", path: "/v1/themes/lookup/" + encodeURIComponent(theme) });
      });
      onClick("#run-bad-lookup", () => void invoke({ method: "GET", path: "/v1/themes/lookup/NEON" }));
      onClick("#run-default", () => void invoke({ method: "GET", path: "/v1/themes/preference" }));
      onClick("#run-strict", () => void invoke({ method: "GET", path: "/v1/themes/preference?theme=NEON" }));
      onClick("#run-fallback", () => void invoke({ method: "GET", path: "/v1/themes/recommendation?theme=NEON" }));
      onClick("#run-current", () => void invoke({ method: "GET", path: "/v1/themes/current" }));
    </script>
  </body>
</html>`;
}
