/// <reference types="vite/client" />

import {
  HeadContent,
  Link,
  Scripts,
  createRootRoute,
} from "@tanstack/solid-router";
import type { JSX } from "solid-js";
import { HydrationScript } from "solid-js/web";

import appCss from "~/styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        name: "description",
        content:
          "Statuswaii is a public status page and incident ops room powered by enumwaii.",
      },
      { title: "Statuswaii · Service health" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  notFoundComponent: NotFoundPage,
  shellComponent: RootDocument,
});

function RootDocument(props: Readonly<{ children: JSX.Element }>) {
  return (
    <html lang="en">
      <head>
        <HydrationScript />
      </head>
      <body>
        <HeadContent />
        <div class="site-shell">
          <header class="topbar">
            <Link class="brand" to="/" search={{}}>
              <span class="brand__mark" aria-hidden="true">
                S
              </span>
              <span>
                <strong>Statuswaii</strong>
                <small>service health</small>
              </span>
            </Link>

            <nav class="topbar__nav" aria-label="Primary navigation">
              <Link
                activeOptions={{ exact: true }}
                activeProps={{ class: "nav-link nav-link--active" }}
                class="nav-link"
                search={{}}
                to="/"
              >
                Public status
              </Link>
              <Link
                activeProps={{ class: "nav-link nav-link--active" }}
                class="nav-link"
                search={{}}
                to="/ops"
              >
                Ops room
              </Link>
            </nav>

            <div class="topbar__status">
              <span class="live-dot" aria-hidden="true" />
              Updated live
            </div>
          </header>

          {props.children}

          <footer class="site-footer">
            <span>enumwaii × TanStack Start × SolidJS</span>
            <span class="mono">STATUS / LIVE</span>
          </footer>
        </div>
        <Scripts />
      </body>
    </html>
  );
}

function NotFoundPage() {
  return (
    <main class="not-found page-frame">
      <p class="eyebrow">404 / Page unavailable</p>
      <h1>This status route does not exist.</h1>
      <p>Return to the public status page for the latest service health.</p>
      <Link class="primary-link" to="/" search={{}}>
        Back to status
      </Link>
    </main>
  );
}
