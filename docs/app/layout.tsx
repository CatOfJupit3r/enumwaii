import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RootProvider } from "fumadocs-ui/provider/next";

import { StaticSearchDialog } from "@/components/static-search";
import { getSiteAssetPath, getSiteUrl } from "@/lib/site";

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
  manifest: getSiteAssetPath("/site.webmanifest"),
  icons: {
    icon: [
      {
        url: getSiteAssetPath("/favicon.ico"),
        type: "image/x-icon",
        sizes: "16x16 32x32 48x48",
      },
      {
        url: getSiteAssetPath("/favicon-96x96.png"),
        type: "image/png",
        sizes: "96x96",
      },
    ],
    shortcut: [getSiteAssetPath("/favicon.ico")],
    apple: [
      {
        url: getSiteAssetPath("/apple-touch-icon.png"),
        type: "image/png",
        sizes: "180x180",
      },
    ],
  },
  openGraph: {
    type: "website",
    url: getSiteUrl("/"),
    siteName: "enumwaii",
    title: "enumwaii — string enums that know where they belong",
    description:
      "String enums with runtime validation, Standard Schema support, and provenance-aware TypeScript types.",
    images: [
      {
        url: getSiteUrl("/icon.png"),
        width: 512,
        height: 512,
        alt: "enumwaii",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "enumwaii — string enums that know where they belong",
    description:
      "String enums with runtime validation, Standard Schema support, and provenance-aware TypeScript types.",
    images: [getSiteUrl("/icon.png")],
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
