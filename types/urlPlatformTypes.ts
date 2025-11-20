export interface Platform {
  id: string;
  name: string;
  icon: React.ReactNode;
  smallIcon: React.ReactNode;
  bgStyle: React.CSSProperties;
  iconBg: string;
  urlPatterns: RegExp[];
}
