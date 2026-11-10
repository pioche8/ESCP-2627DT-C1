import type { NextConfig } from "next";

// STATIC_EXPORT=1 npm run build → a fully static copy in out/ (relative asset paths, unoptimized images) for previews
// and plain static hosts; with NEXT_PUBLIC_BASE_PATH set, absolute paths under that base instead (the Pages export).
// The default build is the Vercel one.
const staticExport = process.env.STATIC_EXPORT === "1";
// The GitHub Pages export (scripts/pages-export.mjs, ADR-0005) serves the site under a path: NEXT_PUBLIC_BASE_PATH =
// "/ESCP-2627DT-C1/website". Next prefixes its own assets and links with it; src/lib/site.ts withBase() does the rest.
// trailingSlash there: /how becomes how/index.html. Next also writes a how/ folder of prefetch data next to how.html, and a
// static host may answer /how from that folder (redirect to how/, then 404) instead of from how.html.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  // Cache Components and partial prefetching are Vercel-only; a static export cannot use them (the page is fully static anyway).
  cacheComponents: !staticExport,
  partialPrefetching: !staticExport,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  ...(staticExport ? { output: "export" as const, images: { unoptimized: true }, ...(basePath ? { basePath, trailingSlash: true } : { assetPrefix: "./" }) } : {}),
};

export default nextConfig;
