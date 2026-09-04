const headers = {
  "content-type": "application/json",
  "x-actor": "Mina, host",
  "x-request-id": "host-stand",
};
const reservations = document.querySelector("#reservations");
const response = document.querySelector("#response");

function escapeHtml(value) {
  const element = document.createElement("span");
  element.textContent = String(value);
  return element.innerHTML;
}

async function request(path, options = {}) {
  const result = await fetch("/api/v1" + path, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  const body = await result.json();
  if (!result.ok)
    throw new Error(
      body?.message ?? "The host stand could not complete that action.",
    );
  return body;
}
function card(reservation) {
  const next = reservation.availableTransitions
    .map(
      (status) =>
        '<button data-id="' +
        reservation.id +
        '" data-version="' +
        reservation.version +
        '" data-to="' +
        status +
        '" type="button">' +
        status.replaceAll("_", " ") +
        "</button>",
    )
    .join("");
  return (
    '<article class="reservation-card"><div class="reservation-top"><strong class="reservation-id">' +
    escapeHtml(reservation.owner) +
    "</strong><span>" +
    reservation.service.toLowerCase() +
    '</span></div><p class="status-pill ' +
    reservation.status.toLowerCase().replaceAll("_", "-") +
    '">' +
    reservation.status.replaceAll("_", " ") +
    '</p><div class="reservation-bottom"><span>' +
    reservation.partySize +
    " guests · v" +
    reservation.version +
    '</span><span class="reservation-next">' +
    (next || "No further actions") +
    "</span></div></article>"
  );
}
async function load() {
  const list = await request("/reservations", {
    method: "GET",
    headers: { "x-actor": "Mina, host", "x-request-id": "host-list" },
  });
  reservations.innerHTML = list.map(card).join("");
}
reservations.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-to]");
  if (!button) return;
  try {
    await request("/reservations/" + button.dataset.id + "/transitions", {
      method: "POST",
      body: JSON.stringify({
        to: button.dataset.to,
        expectedVersion: Number(button.dataset.version),
      }),
    });
    await load();
  } catch (error) {
    response.textContent = error.message;
  }
});
document
  .querySelector("#request-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await request("/reservations", {
        method: "POST",
        body: JSON.stringify({
          owner: form.get("owner"),
          partySize: Number(form.get("partySize")),
          service: form.get("service"),
        }),
      });
      formElement.reset();
      await load();
    } catch (error) {
      response.textContent = error.message;
    }
  });
document.querySelector("#reset").addEventListener("click", async () => {
  await request("/reservations/reset", { method: "POST", body: "{}" });
  await load();
});
document.querySelectorAll("[data-status]").forEach((button) =>
  button.addEventListener("click", async () => {
    try {
      response.textContent = JSON.stringify(
        await request("/reservations/availability", {
          method: "POST",
          body: JSON.stringify(button.dataset.status),
        }),
        null,
        2,
      );
    } catch (error) {
      response.textContent = error.message;
    }
  }),
);
load().catch((error) => {
  reservations.textContent = error.message;
});
