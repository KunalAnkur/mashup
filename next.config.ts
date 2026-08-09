import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  /**
   * Arcade's published output is already compiled, but it still carries "use client"
   * directives and imports its games' i18n JSON, so it goes through the same pipeline
   * as the rest of the app.
   *
   * One entry, and it stays one entry: individual games are resolved inside
   * arcade-client by relative path, so adding a game never touches this file.
   */
  transpilePackages: ["@movmash/arcade-client"],

  /*
   * `turbopack.root` used to live here, pointing at the parent directory so Turbopack
   * would follow the symlink into the sibling `arcade/` repo. Removed with the move to
   * the registry: arcade is now an ordinary package inside node_modules, and on Vercel
   * the parent directory is not this monorepo, so the override would be wrong there.
   *
   * If you switch a local checkout back to `link:` for arcade development, you need it
   * again — see ACTIVITIES_DEPLOYMENT_PLAN.md.
   */

  /*  experimental: {
    serverActions: {
      bodySizeLimit: "100MB",
    },
  }, */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.pixabay.com",
      },
      {
        protocol: "https",
        hostname: "img.freepik.com",
      },
      {
        protocol: "https",
        hostname: "png.pngtree.com",
      },
      {
        protocol: "https",
        hostname: "pngtree.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
