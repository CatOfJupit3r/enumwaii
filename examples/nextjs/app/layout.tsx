import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Signal Desk · enumwaii Next.js example",
  description:
    "A production-shaped operations dashboard demonstrating enumwaii at Next.js server boundaries.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
