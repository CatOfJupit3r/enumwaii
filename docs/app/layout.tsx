import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RootProvider } from "fumadocs-ui/provider/next";

import { StaticSearchDialog } from "@/components/static-search";

import "./global.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://catofjupit3r.github.io/enumwaii/"),
  title: {
    default: "enumwaii — owned string enums for TypeScript",
    template: "%s | enumwaii",
  },
  description:
    "String enums with runtime validation, Standard Schema support, and provenance-aware TypeScript types.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RootProvider search={{ SearchDialog: StaticSearchDialog }}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
