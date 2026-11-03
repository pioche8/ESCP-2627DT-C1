import type { NextConfig } from "next";

// STATIC_EXPORT=1 npm run build → a fully static copy in out/ (relative asset paths, unoptimized images) for previews
// and plain static hosts. The default build is the Vercel one.
const staticExport = process.env.STATIC_EXPORT === "1";

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
  ...(staticExport ? { output: "export" as const, assetPrefix: "./", images: { unoptimized: true } } : {}),
};

export default nextConfig;
