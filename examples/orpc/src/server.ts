import { serve } from "@hono/node-server";
import { app } from "./app";

function readPort(value: string | undefined): number {
  const port = Number(value ?? "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(
      "PORT must be an integer from 1 to 65535; received " + value,
    );
  }
  return port;
}

const port = readPort(process.env.PORT);
serve({ fetch: app.fetch, hostname: "127.0.0.1", port }, (info) => {
  console.log("Tablewaii ready at http://127.0.0.1:" + info.port);
});
