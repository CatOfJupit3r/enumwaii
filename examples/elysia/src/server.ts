import { app } from "./app";

function resolvePort(input: string | undefined): number {
  if (input === undefined) return 3000;

  const port = Number(input);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(
      `PORT must be an integer from 1 to 65535; received ${input}`,
    );
  }

  return port;
}

const port = resolvePort(process.env.PORT);

app.listen(port, ({ hostname, port: listeningPort }) => {
  console.log(
    `Theme Boundary Console running at http://${hostname}:${listeningPort}`,
  );
});
