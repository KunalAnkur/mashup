// Use string paths for static assets in Next.js public directory
const logo = '/assets/logo-512.png';
const logo192 = "/assets/logo-192.png";
const visualizerLogo = '/assets/logo-visualizer1.svg';
const defaultAvatar =
  "https://png.pngtree.com/png-vector/20231019/ourmid/pngtree-user-profile-avatar-png-image_10211471.png";

// Art behind the sidebar's promo card. On the CDN rather than in public/ so it can be
// swapped without a deploy — the same reason arcade keeps its game covers there.
const sidebarIllustration = "https://asset.movmash.com/platform/img/sidebar_illus.png";

export { logo, logo192, defaultAvatar, visualizerLogo, sidebarIllustration };
