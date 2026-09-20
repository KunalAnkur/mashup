// Use string paths for static assets in Next.js public directory
const logo = '/assets/logo-512.png';
const logo192 = "/assets/logo-192.png";
const visualizerLogo = '/assets/logo-visualizer1.svg';
const defaultAvatar =
  "https://png.pngtree.com/png-vector/20231019/ourmid/pngtree-user-profile-avatar-png-image_10211471.png";

// Art behind the sidebar's promo card. On the CDN rather than in public/ so it can be
// swapped without a deploy — the same reason arcade keeps its game covers there.
const sidebarIllustration = "https://asset.movmash.com/platform/img/sidebar_illus.png";

// Art at the top of the home rail's join-by-code card. On the CDN for the same reason as
// the sidebar illustration above — swapping the picture should not need a deploy.
const joinRoomIllustration = "https://asset.movmash.com/platform/img/join_room_card.webp";

export {
  logo,
  logo192,
  defaultAvatar,
  visualizerLogo,
  sidebarIllustration,
  joinRoomIllustration,
};
