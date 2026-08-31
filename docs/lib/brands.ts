export const brandAssets = {
  bun: {
    href: "https://bun.com/",
    label: "Bun",
    src: "/brands/bun.svg",
  },
  deno: {
    href: "https://deno.com/",
    label: "Deno",
    src: "/brands/deno.svg",
  },
  effect: {
    href: "https://effect.website/",
    label: "Effect",
    needsLightSurface: true,
    src: "/brands/effect.svg",
  },
  elysia: {
    href: "https://elysiajs.com/",
    label: "Elysia",
    needsLightSurface: true,
    src: "/brands/elysia.svg",
  },
  expo: {
    href: "https://expo.dev/",
    label: "Expo",
    needsLightSurface: true,
    src: "/brands/expo.svg",
  },
  hono: {
    href: "https://hono.dev/",
    label: "Hono",
    src: "/brands/hono.svg",
  },
  mongoose: {
    href: "https://mongoosejs.com/",
    label: "Mongoose",
    src: "/brands/mongoose.svg",
    needsLightSurface: true,
  },
  nestjs: {
    href: "https://nestjs.com/",
    label: "NestJS",
    src: "/brands/nestjs.svg",
  },
  nextjs: {
    href: "https://nextjs.org/",
    label: "Next.js",
    needsLightSurface: true,
    src: "/brands/nextjs.svg",
  },
  nodejs: {
    href: "https://nodejs.org/",
    label: "Node.js",
    src: "/brands/nodejs.svg",
  },
  orpc: {
    href: "https://orpc.dev/",
    label: "oRPC",
    src: "/brands/orpc.svg",
  },
  pglite: {
    href: "https://pglite.dev/",
    label: "PGlite",
    src: "/brands/pglite.svg",
  },
  solid: {
    href: "https://www.solidjs.com/",
    label: "Solid",
    src: "/brands/solid.svg",
  },
  tanstack: {
    href: "https://tanstack.com/",
    label: "TanStack",
    src: "/brands/tanstack.svg",
  },
  tanstackStart: {
    href: "https://tanstack.com/start",
    label: "TanStack Start",
    src: "/brands/tanstack.svg",
  },
  vue: {
    href: "https://vuejs.org/",
    label: "Vue",
    src: "/brands/vue.svg",
  },
} as const;

export type BrandAssetName = keyof typeof brandAssets;

export function brandAssetPath(name: BrandAssetName): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${brandAssets[name].src}`;
}
