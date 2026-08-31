import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RootProvider } from "fumadocs-ui/provider/next";

import { StaticSearchDialog } from "@/components/static-search";
import { getSiteUrl } from "@/lib/site";

import "./global.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://catofjupit3r.github.io/enumwaii/"),
  title: {
    default: "enumwaii — string enums that know where they belong",
    template: "%s | enumwaii",
  },
  description:
    "String enums with runtime validation, Standard Schema support, and provenance-aware TypeScript types.",
  alternates: {
    types: {
      "text/markdown": getSiteUrl("/llms.md"),
    },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="describedby" href={getSiteUrl("/llms.txt")} />
      </head>
      <body>
        <RootProvider search={{ SearchDialog: StaticSearchDialog }}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
