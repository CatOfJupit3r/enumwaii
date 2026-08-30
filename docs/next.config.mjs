import { createMDX } from "fumadocs-mdx/next";

const basePath = process.env.PAGES_BASE_PATH ?? "";

/** @type {import("next").NextConfig} */
const nextConfig = {
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    unoptimized: true,
  },
  output: "export",
  reactStrictMode: true,
  trailingSlash: true,
};

export default createMDX()(nextConfig);
