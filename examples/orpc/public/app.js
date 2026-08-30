const API_ROOT = "/api/v1";
const ACTOR = "console-operator";

const state = { jobs: [] };

const elements = {
  jobInput: document.querySelector("#job-input"),
  jobsList: document.querySelector("#jobs-list"),
  refreshJobs: document.querySelector("#refresh-jobs"),
  requestOutput: document.querySelector("#request-output"),
  resetJobs: document.querySelector("#reset-jobs"),
  responseMethod: document.querySelector("#response-method"),
  responseOutput: document.querySelector("#response-output"),
  responsePath: document.querySelector("#response-path"),
  responseStatus: document.querySelector("#response-status"),
  responseTime: document.querySelector("#response-time"),
  serviceLabel: document.querySelector("#service-label"),
  serviceOrigin: document.querySelector("#service-origin"),
  serviceState: document.querySelector("#service-state"),
  statusInput: document.querySelector("#status-input"),
  transitionForm: document.querySelector("#transition-form"),
  versionInput: document.querySelector("#version-input"),
};

function formatJson(value) {
  return JSON.stringify(value, null, 2);
}

function requestId() {
  return `ui-${crypto.randomUUID().slice(0, 8)}`;
}

async function apiRequest(path, options = {}) {
  const method = options.method ?? "GET";
  const headers = new Headers(options.headers);
  const authenticated = options.authenticated ?? true;
  if (authenticated) headers.set("x-actor", ACTOR);
  headers.set("x-request-id", requestId());

  let body;
  if (options.body !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(options.body);
  }

  const started = performance.now();
  const response = await fetch(path, { body, headers, method });
  const elapsed = Math.round(performance.now() - started);
  const text = await response.text();
  let payload = text;
  try {
    payload = text.length === 0 ? null : JSON.parse(text);
  } catch {
    // Preserve non-JSON responses for inspection.
  }

  return {
    elapsed,
    method,
    path,
    payload,
    request: options.body ?? null,
    status: response.status,
  };
}

function renderExchange(exchange) {
  elements.responseMethod.textContent = exchange.method;
  elements.responsePath.textContent = exchange.path;
  elements.responseStatus.textContent = String(exchange.status);
  elements.responseStatus.className = `response-status ${
    exchange.status >= 400 ? "error" : "success"
  }`;
  elements.responseTime.textContent = `${exchange.elapsed} ms`;
  elements.requestOutput.textContent = formatJson(exchange.request);
  elements.responseOutput.textContent =
    typeof exchange.payload === "string"
      ? exchange.payload
      : formatJson(exchange.payload);
}

function renderJobs() {
  elements.jobsList.replaceChildren(
    ...state.jobs.map((job) => {
      const card = document.createElement("article");
      card.className = "job-card";

      const next =
        job.availableTransitions.length === 0
          ? "terminal state"
          : `next · ${job.availableTransitions.join(" / ")}`;

      card.innerHTML = `
        <div class="job-top">
          <span class="job-id">${job.id}</span>
          <span class="job-owner">${job.owner}</span>
        </div>
        <span class="status-pill ${job.status.toLowerCase()}">${job.status}</span>
        <div class="job-bottom">
          <span class="job-next" title="${next}">${next}</span>
          <span class="job-version">v${job.version}</span>
        </div>
      `;
      return card;
    }),
  );

  const selectedId = elements.jobInput.value;
  elements.jobInput.replaceChildren(
    ...state.jobs.map((job) => {
      const option = document.createElement("option");
      option.value = job.id;
      option.textContent = `${job.id} · ${job.status}`;
      option.selected = job.id === selectedId;
      return option;
    }),
  );
  syncVersionInput();
}

function syncVersionInput() {
  const job = state.jobs.find(
    (candidate) => candidate.id === elements.jobInput.value,
  );
  if (job !== undefined) elements.versionInput.value = String(job.version);
}

async function loadJobs(showExchange = false) {
  const exchange = await apiRequest(`${API_ROOT}/jobs`);
  if (exchange.status < 400 && Array.isArray(exchange.payload)) {
    state.jobs = exchange.payload;
    renderJobs();
  }
  if (showExchange) renderExchange(exchange);
  return exchange;
}

function firstJob() {
  const job = state.jobs[0];
  if (job === undefined) throw new Error("No demo jobs are available");
  return job;
}

function transitionRequest(job, to, expectedVersion = job.version) {
  return apiRequest(
    `${API_ROOT}/jobs/${encodeURIComponent(job.id)}/transitions`,
    {
      method: "POST",
      body: { expectedVersion, to },
    },
  );
}

const scenarios = {
  valid: () =>
    apiRequest(`${API_ROOT}/jobs/status`, { method: "POST", body: "RUNNING" }),
  unknown: () =>
    apiRequest(`${API_ROOT}/jobs/status`, { method: "POST", body: "PAUSED" }),
  "wrong-type": () =>
    apiRequest(`${API_ROOT}/jobs/status`, { method: "POST", body: 42 }),
  legal: () => {
    const job =
      state.jobs.find(
        (candidate) => candidate.availableTransitions.length > 0,
      ) ?? firstJob();
    const target = job.availableTransitions[0] ?? "RUNNING";
    return transitionRequest(job, target);
  },
  illegal: () => {
    const job = firstJob();
    return transitionRequest(job, job.status);
  },
  version: () => {
    const job = firstJob();
    const target = job.availableTransitions[0] ?? "RUNNING";
    return transitionRequest(job, target, job.version + 100);
  },
  missing: () =>
    apiRequest(`${API_ROOT}/jobs/missing/transitions`, {
      method: "POST",
      body: { expectedVersion: 0, to: "RUNNING" },
    }),
  middleware: () => apiRequest(`${API_ROOT}/jobs`, { authenticated: false }),
  output: () =>
    apiRequest(`${API_ROOT}/jobs/status`, {
      method: "POST",
      body: "QUEUED",
      headers: { "x-demo-corrupt-output": "enabled" },
    }),
};

async function runScenario(button) {
  const name = button.dataset.scenario;
  const scenario = scenarios[name];
  if (scenario === undefined) return;

  button.classList.add("running");
  try {
    const exchange = await scenario();
    renderExchange(exchange);
    if (name === "legal" && exchange.status < 400) await loadJobs();
  } catch (error) {
    renderClientError(error);
  } finally {
    button.classList.remove("running");
  }
}

function renderClientError(error) {
  elements.responseStatus.textContent = "CLIENT";
  elements.responseStatus.className = "response-status error";
  elements.responseOutput.textContent =
    error instanceof Error ? error.message : String(error);
}

for (const button of document.querySelectorAll("[data-scenario]")) {
  button.addEventListener("click", () => runScenario(button));
}

elements.refreshJobs.addEventListener("click", async () => {
  try {
    await loadJobs(true);
  } catch (error) {
    renderClientError(error);
  }
});

elements.resetJobs.addEventListener("click", async () => {
  try {
    const exchange = await apiRequest(`${API_ROOT}/jobs/reset`, {
      method: "POST",
      body: {},
    });
    renderExchange(exchange);
    if (exchange.status < 400 && Array.isArray(exchange.payload)) {
      state.jobs = exchange.payload;
      renderJobs();
    }
  } catch (error) {
    renderClientError(error);
  }
});

elements.jobInput.addEventListener("change", syncVersionInput);

elements.transitionForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const job = state.jobs.find(
    (candidate) => candidate.id === elements.jobInput.value,
  );
  if (job === undefined) return;

  try {
    const exchange = await transitionRequest(
      job,
      elements.statusInput.value,
      Number(elements.versionInput.value),
    );
    renderExchange(exchange);
    if (exchange.status < 400) await loadJobs();
  } catch (error) {
    renderClientError(error);
  }
});

async function connect() {
  elements.serviceOrigin.textContent = window.location.host;
  try {
    const response = await fetch("/health");
    if (!response.ok) throw new Error("Health check failed");
    elements.serviceState.classList.add("online");
    elements.serviceLabel.textContent = "Service online";
    await loadJobs(true);
  } catch (error) {
    elements.serviceState.classList.add("offline");
    elements.serviceLabel.textContent = "Service unavailable";
    renderClientError(error);
  }
}

await connect();
