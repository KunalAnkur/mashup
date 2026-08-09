import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

/**
 * True only when `@movmash/arcade-client` is linked to a checkout outside this app —
 * i.e. `link:../arcade/packages/client`, used while developing a game.
 *
 * Turbopack will not resolve outside its inferred root, so that setup needs the root
 * widened to the parent. Installed from the registry it is an ordinary folder inside
 * node_modules and the override would be wrong — on Vercel actively so, since the
 * parent directory there is not this monorepo.
 *
 * Detected rather than toggled by hand: this and the dependency line have to agree,
 * and a mismatch fails as "module not found", which does not name its cause.
 */
function arcadeIsLinkedOutside(): boolean {
  const pkg = path.join(__dirname, "node_modules", "@movmash", "arcade-client");
  try {
    // pnpm symlinks even a registry install (into `node_modules/.pnpm/…`), so being
    // a symlink proves nothing on its own — where it *lands* is the question.
    if (!fs.lstatSync(pkg).isSymbolicLink()) return false;

    // Both sides must be resolved before comparing. Resolving only the target is a
    // real bug on any machine where the project path itself contains a symlink —
    // macOS `/var` -> `/private/var`, a symlinked home, a container mount — because
    // the prefixes then never match and a registry install looks "linked outside".
    const here = fs.realpathSync(__dirname);
    return !fs.realpathSync(pkg).startsWith(path.join(here, path.sep));
  } catch {
    // Not installed yet, or no node_modules — nothing to widen the root for.
    return false;
  }
}

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

  // Applied only when arcade is linked to a sibling checkout — see above. With a
  // registry install this is absent, which is what Vercel needs.
  ...(arcadeIsLinkedOutside()
    ? { turbopack: { root: path.join(__dirname, "..") } }
    : {}),

  /*
   * The note below is kept because it explains the trade-off. `turbopack.root` is now
   * applied conditionally rather than deleted:
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
