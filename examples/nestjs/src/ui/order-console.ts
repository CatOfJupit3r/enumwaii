export function renderOrderConsole(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Order Current · NestJS, Mongoose & enumwaii</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #17211b;
      --muted: #66736b;
      --paper: #f5f2e9;
      --panel: rgba(255, 255, 252, .88);
      --line: #d9d8cb;
      --green: #215b47;
      --green-2: #2e7a5d;
      --orange: #dc6b3f;
      --amber: #d59e42;
      --shadow: 0 18px 55px rgba(30, 46, 36, .12);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--ink);
      background:
        radial-gradient(circle at 10% -10%, rgba(224, 167, 75, .28), transparent 30rem),
        radial-gradient(circle at 100% 16%, rgba(47, 127, 95, .22), transparent 34rem),
        var(--paper);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    button, input, select { font: inherit; }
    button { cursor: pointer; }
    .shell { width: min(1180px, calc(100% - 32px)); margin: 0 auto; padding: 26px 0 58px; }
    nav { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
    .brand { display: flex; align-items: center; gap: 11px; font-weight: 760; letter-spacing: -.02em; }
    .mark {
      display: grid; place-items: center; width: 38px; height: 38px; border-radius: 12px;
      color: #fff; background: var(--green); box-shadow: 0 8px 22px rgba(33, 91, 71, .24);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px;
    }
    .connection { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 13px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--amber); box-shadow: 0 0 0 5px rgba(213, 158, 66, .13); }
    .dot.live { background: #2b9b6e; box-shadow: 0 0 0 5px rgba(43, 155, 110, .13); }
    header { padding: 74px 0 40px; display: grid; grid-template-columns: 1.5fr .7fr; gap: 30px; align-items: end; }
    .eyebrow { color: var(--green-2); text-transform: uppercase; letter-spacing: .16em; font-size: 12px; font-weight: 800; }
    h1 { max-width: 760px; margin: 12px 0 16px; font-family: Georgia, "Times New Roman", serif; font-size: clamp(43px, 7vw, 82px); line-height: .94; font-weight: 500; letter-spacing: -.055em; }
    .lede { max-width: 690px; margin: 0; color: var(--muted); font-size: 17px; line-height: 1.65; }
    .stack { justify-self: end; display: grid; gap: 8px; }
    .stack span { padding: 8px 12px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); background: rgba(255,255,255,.55); font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; }
    .layout { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(320px, .8fr); gap: 20px; align-items: start; }
    .column { display: grid; gap: 20px; }
    .panel { border: 1px solid rgba(193, 194, 182, .72); border-radius: 24px; background: var(--panel); box-shadow: var(--shadow); backdrop-filter: blur(12px); overflow: hidden; }
    .panel-head { padding: 22px 24px 18px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: flex-start; gap: 18px; }
    .panel-head h2 { margin: 0 0 5px; font-size: 17px; letter-spacing: -.02em; }
    .panel-head p { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.5; }
    .route { color: var(--green); padding: 6px 9px; border-radius: 8px; background: #e7eee8; font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; white-space: nowrap; }
    .create { padding: 20px 24px 24px; display: grid; grid-template-columns: 1fr 160px auto; gap: 10px; }
    input, select { width: 100%; border: 1px solid var(--line); border-radius: 12px; padding: 11px 12px; color: var(--ink); background: #fff; outline: none; }
    input:focus, select:focus { border-color: var(--green-2); box-shadow: 0 0 0 3px rgba(46, 122, 93, .1); }
    .primary, .secondary, .danger, .lab-button { border: 0; border-radius: 12px; padding: 11px 14px; font-weight: 720; transition: transform .16s ease, filter .16s ease; }
    button:hover { transform: translateY(-1px); filter: brightness(.98); }
    .primary { color: #fff; background: var(--green); }
    .secondary { color: var(--green); background: #e3eee8; }
    .danger { color: #8d392c; background: #fae9e4; }
    .orders { padding: 12px; display: grid; gap: 9px; max-height: 530px; overflow: auto; }
    .empty { padding: 54px 20px; text-align: center; color: var(--muted); line-height: 1.6; }
    .order { width: 100%; border: 1px solid transparent; border-radius: 16px; padding: 15px; display: grid; grid-template-columns: auto 1fr auto; gap: 13px; align-items: center; color: inherit; background: transparent; text-align: left; }
    .order:hover, .order.selected { border-color: #cbd8cf; background: #f2f7f3; transform: none; }
    .status-bar { width: 5px; height: 44px; border-radius: 99px; background: var(--amber); }
    .status-bar.blue { background: #4b79a8; } .status-bar.green { background: #34946b; } .status-bar.slate { background: #748078; }
    .order-title { font-weight: 760; letter-spacing: -.01em; }
    .order-meta { margin-top: 4px; color: var(--muted); font-size: 12px; }
    .version { color: var(--muted); font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; }
    .selection { padding: 22px 24px 24px; }
    .selection h3 { margin: 0 0 7px; font-size: 23px; font-family: Georgia, "Times New Roman", serif; font-weight: 500; }
    .selection p { color: var(--muted); line-height: 1.55; margin: 0; }
    .selection-code { display: block; margin: 16px 0; padding: 10px 12px; overflow: hidden; text-overflow: ellipsis; border-radius: 10px; background: #f0f0e9; color: #536158; font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .labs { padding: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
    .lab-button { min-height: 78px; border: 1px solid var(--line); color: var(--ink); background: #fff; text-align: left; }
    .lab-button strong { display: block; margin-bottom: 5px; font-size: 13px; }
    .lab-button span { display: block; color: var(--muted); font-size: 11px; line-height: 1.4; font-weight: 500; }
    .log { padding: 16px 18px 20px; min-height: 190px; max-height: 370px; overflow: auto; background: #18231d; color: #dae5dc; font: 12px/1.55 ui-monospace, SFMono-Regular, Menlo, monospace; }
    .event { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,.08); white-space: pre-wrap; overflow-wrap: anywhere; }
    .event:last-child { border-bottom: 0; }
    .event .ok { color: #80d7ac; } .event .bad { color: #ff9d83; } .event .dim { color: #8fa197; }
    footer { margin-top: 26px; display: flex; justify-content: space-between; gap: 20px; color: var(--muted); font-size: 12px; }
    footer code { color: var(--green); }
    @media (max-width: 880px) {
      header { grid-template-columns: 1fr; padding-top: 54px; }
      .stack { justify-self: start; grid-auto-flow: column; }
      .layout { grid-template-columns: 1fr; }
      .create { grid-template-columns: 1fr 150px; }
      .create .primary { grid-column: 1 / -1; }
    }
    @media (max-width: 560px) {
      .shell { width: min(100% - 20px, 1180px); padding-top: 14px; }
      nav .connection span:last-child { display: none; }
      header { padding: 42px 4px 28px; }
      h1 { font-size: 48px; }
      .stack { grid-auto-flow: row; grid-template-columns: 1fr 1fr; }
      .panel { border-radius: 18px; }
      .panel-head { padding: 18px; }
      .create { padding: 18px; grid-template-columns: 1fr; }
      .create .primary { grid-column: auto; }
      .labs { grid-template-columns: 1fr; }
      footer { flex-direction: column; }
    }
  </style>
</head>
<body>
  <main class="shell">
    <nav>
      <div class="brand"><span class="mark">EW</span><span>enumwaii / Order Current</span></div>
      <div class="connection"><span id="mongo-dot" class="dot"></span><span id="connection-label">Checking Mongo-backed API…</span></div>
    </nav>

    <header>
      <div>
        <div class="eyebrow">A live framework boundary</div>
        <h1>One order state, all the way through.</h1>
        <p class="lede">Nest pipes validate untrusted scalars, Mongoose stores canonical raw strings, and hydration restores the enumwaii brand before workflow logic runs.</p>
      </div>
      <div class="stack"><span>NestJS 12</span><span>Mongoose 9</span><span>MongoDB 8</span><span>enumwaii</span></div>
    </header>

    <section class="layout">
      <div class="column">
        <article class="panel">
          <div class="panel-head">
            <div><h2>Orders in MongoDB</h2><p>Create an order, select it, then exercise versioned transitions.</p></div>
            <code class="route">GET /api/orders</code>
          </div>
          <form id="create-form" class="create">
            <input id="memo" name="memo" maxlength="180" placeholder="Order memo (optional)">
            <select id="create-status" name="status" aria-label="Initial order status">
              <option value="">Default → PENDING</option>
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID</option>
            </select>
            <button class="primary" type="submit">Create order</button>
          </form>
          <div id="orders" class="orders"><div class="empty">Loading orders from MongoDB…</div></div>
        </article>

        <article class="panel">
          <div class="panel-head">
            <div><h2>Selected workflow</h2><p>Legal transitions, domain conflicts, and optimistic concurrency use the same record.</p></div>
            <code class="route">PATCH /api/orders/:id/status</code>
          </div>
          <div id="selection" class="selection"><p>Select or create an order to enable workflow operations.</p></div>
        </article>
      </div>

      <div class="column">
        <article class="panel">
          <div class="panel-head">
            <div><h2>Boundary lab</h2><p>Each button calls a real decorated Nest route and its named enumwaii pipe policy.</p></div>
            <code class="route">/api/boundary/*</code>
          </div>
          <div class="labs">
            <button class="lab-button" data-lab="valid"><strong>Valid scalar</strong><span>Strict path param · PAID</span></button>
            <button class="lab-button" data-lab="unknown"><strong>Unknown string</strong><span>Strict body field · no member leak</span></button>
            <button class="lab-button" data-lab="wrong"><strong>Wrong primitive</strong><span>Strict body field · number</span></button>
            <button class="lab-button" data-lab="nil"><strong>Nil default</strong><span>Missing query → PENDING</span></button>
            <button class="lab-button" data-lab="malformed"><strong>Malformed stays strict</strong><span>Default route rejects unknown</span></button>
            <button class="lab-button" data-lab="fallback"><strong>Explicit fallback</strong><span>Unknown query → PENDING</span></button>
            <button class="lab-button" data-lab="missing"><strong>Missing record</strong><span>Valid ObjectId · 404 filter</span></button>
            <button class="lab-button" data-lab="conflict"><strong>Stale version</strong><span>Optimistic conflict · 409 filter</span></button>
          </div>
        </article>

        <article class="panel">
          <div class="panel-head">
            <div><h2>HTTP trace</h2><p>Status and JSON returned by the running application.</p></div>
            <button id="clear-log" class="secondary" type="button">Clear</button>
          </div>
          <div id="log" class="log"><div class="event"><span class="dim">Ready for an operation.</span></div></div>
        </article>
      </div>
    </section>

    <footer><span>Every order shown above came from <code>Model.find()</code>.</span><span>No Docker is required for the unit and schema tests.</span></footer>
  </main>

  <script>
    const statusValues = ['PENDING', 'PAID', 'SHIPPED', 'CANCELLED'];
    const state = { orders: [], selectedId: null };
    const ordersElement = document.getElementById('orders');
    const selectionElement = document.getElementById('selection');
    const logElement = document.getElementById('log');
    const mongoDot = document.getElementById('mongo-dot');
    const connectionLabel = document.getElementById('connection-label');

    async function api(path, options) {
      try {
        const response = await fetch(path, options);
        const text = await response.text();
        let data = null;
        try { data = text ? JSON.parse(text) : null; } catch { data = text; }
        return { ok: response.ok, status: response.status, data };
      } catch (error) {
        return { ok: false, status: 0, data: { error: 'Network Error', message: error instanceof Error ? error.message : String(error) } };
      }
    }

    function writeLog(label, result) {
      const event = document.createElement('div');
      event.className = 'event';
      const heading = document.createElement('span');
      heading.className = result.ok ? 'ok' : 'bad';
      heading.textContent = (result.ok ? '✓ ' : '× ') + label + ' · HTTP ' + result.status;
      const body = document.createElement('div');
      body.textContent = JSON.stringify(result.data, null, 2);
      event.append(heading, body);
      logElement.prepend(event);
    }

    function selectedOrder() {
      return state.orders.find((order) => order.id === state.selectedId) || null;
    }

    function renderOrders() {
      ordersElement.replaceChildren();
      if (!state.orders.length) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = 'MongoDB is connected. Create the first order to begin.';
        ordersElement.append(empty);
        return;
      }
      state.orders.forEach((order) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'order' + (order.id === state.selectedId ? ' selected' : '');
        button.addEventListener('click', () => { state.selectedId = order.id; renderOrders(); renderSelection(); });
        const bar = document.createElement('span');
        bar.className = 'status-bar ' + order.presentation.tone;
        const copy = document.createElement('span');
        const title = document.createElement('div');
        title.className = 'order-title';
        title.textContent = order.presentation.label + (order.memo ? ' · ' + order.memo : '');
        const meta = document.createElement('div');
        meta.className = 'order-meta';
        meta.textContent = order.presentation.description;
        copy.append(title, meta);
        const version = document.createElement('span');
        version.className = 'version';
        version.textContent = 'v' + order.version;
        button.append(bar, copy, version);
        ordersElement.append(button);
      });
    }

    function actionButton(label, className, onClick) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = className;
      button.textContent = label;
      button.addEventListener('click', onClick);
      return button;
    }

    function renderSelection() {
      selectionElement.replaceChildren();
      const order = selectedOrder();
      if (!order) {
        const message = document.createElement('p');
        message.textContent = 'Select or create an order to enable workflow operations.';
        selectionElement.append(message);
        return;
      }
      const title = document.createElement('h3');
      title.textContent = order.presentation.label + ' · version ' + order.version;
      const description = document.createElement('p');
      description.textContent = order.presentation.description + '. Allowed next: ' + (order.allowedTransitions.join(', ') || 'none (terminal state)') + '.';
      const code = document.createElement('code');
      code.className = 'selection-code';
      code.textContent = order.id;
      const actions = document.createElement('div');
      actions.className = 'actions';
      const next = order.allowedTransitions[0];
      actions.append(actionButton(next ? 'Transition → ' + next : 'Terminal state', 'primary', async () => {
        if (!next) return;
        await transitionOrder(order, next, order.version, 'Legal transition');
      }));
      const illegal = statusValues.find((status) => status !== order.status && !order.allowedTransitions.includes(status));
      actions.append(actionButton('Illegal transition', 'danger', async () => {
        if (illegal) await transitionOrder(order, illegal, order.version, 'Illegal transition');
      }));
      actions.append(actionButton('Stale version', 'secondary', async () => {
        await transitionOrder(order, next || 'PENDING', order.version + 7, 'Optimistic version conflict');
      }));
      selectionElement.append(title, description, code, actions);
    }

    async function loadOrders(logResult) {
      const result = await api('/api/orders');
      if (result.ok && Array.isArray(result.data)) {
        state.orders = result.data;
        if (!selectedOrder()) state.selectedId = state.orders[0] ? state.orders[0].id : null;
        mongoDot.classList.add('live');
        connectionLabel.textContent = 'Mongo-backed API connected';
      } else {
        mongoDot.classList.remove('live');
        connectionLabel.textContent = 'Mongo-backed API unavailable';
      }
      renderOrders();
      renderSelection();
      if (logResult) writeLog('List orders', result);
      return result;
    }

    async function transitionOrder(order, to, expectedVersion, label) {
      const result = await api('/api/orders/' + order.id + '/status', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ to, expectedVersion })
      });
      writeLog(label, result);
      if (result.ok) await loadOrders(false);
    }

    document.getElementById('create-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const memo = document.getElementById('memo').value;
      const status = document.getElementById('create-status').value;
      const body = { memo };
      if (status) body.status = status;
      const result = await api('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      });
      writeLog('Create order', result);
      if (result.ok) {
        state.selectedId = result.data.id;
        document.getElementById('memo').value = '';
        await loadOrders(false);
      }
    });

    const labs = {
      valid: () => api('/api/boundary/strict/PAID'),
      unknown: () => api('/api/boundary/strict', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'RETURNED' }) }),
      wrong: () => api('/api/boundary/strict', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 42 }) }),
      nil: () => api('/api/boundary/default'),
      malformed: () => api('/api/boundary/default?status=RETURNED'),
      fallback: () => api('/api/boundary/fallback?status=RETURNED'),
      missing: () => api('/api/orders/000000000000000000000000/status', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ to: 'PAID', expectedVersion: 1 }) }),
      conflict: () => {
        const order = selectedOrder();
        return order
          ? api('/api/orders/' + order.id + '/status', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ to: order.allowedTransitions[0] || 'PENDING', expectedVersion: order.version + 7 }) })
          : Promise.resolve({ ok: false, status: 0, data: { message: 'Create or select an order first.' } });
      }
    };
    document.querySelectorAll('[data-lab]').forEach((button) => {
      button.addEventListener('click', async () => {
        const name = button.getAttribute('data-lab');
        const result = await labs[name]();
        writeLog(button.querySelector('strong').textContent, result);
      });
    });
    document.getElementById('clear-log').addEventListener('click', () => { logElement.replaceChildren(); });
    void loadOrders(false);
  </script>
</body>
</html>`;
}
