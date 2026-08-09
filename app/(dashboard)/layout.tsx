import DashboardShell from "@/components/Sidebar/DashboardShell";

// Every route inside this group gets the sidebar dashboard shell. Excluded on purpose,
// by not being inside this group: /pricing (keeps EntryPageHeader only), /room/[roomId]
// (neither header nor sidebar — has its own in-room chrome), and /login (plain centered
// card, see app/(auth)/layout.tsx).
const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <DashboardShell>{children}</DashboardShell>
);

export default DashboardLayout;
