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
          "A TanStack Start and Solid incident control room powered by enumwaii.",
      },
      { title: "Northstar · Release control" },
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
                N
              </span>
              <span>
                <strong>Northstar</strong>
                <small>release operations</small>
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
                Control room
              </Link>
              <Link
                activeProps={{ class: "nav-link nav-link--active" }}
                class="nav-link"
                to="/validation"
              >
                Boundary lab
              </Link>
            </nav>

            <div class="topbar__status">
              <span class="live-dot" aria-hidden="true" />
              Live environment
            </div>
          </header>

          {props.children}

          <footer class="site-footer">
            <span>enumwaii × TanStack Start × SolidJS</span>
            <span class="mono">CONTROL / 042</span>
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
      <p class="eyebrow">404 / Signal lost</p>
      <h1>This route is outside the runbook.</h1>
      <p>Return to the release control room and re-establish context.</p>
      <Link class="primary-link" to="/" search={{}}>
        Back to control room
      </Link>
    </main>
  );
}
