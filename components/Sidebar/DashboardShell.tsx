"use client";

import { ReactNode } from "react";
import DashboardSidebar from "./DashboardSidebar";
import MobileDashboardBars from "./MobileDashboardBars";
import { dashShellGridClass } from "../UI/classTokens";

type DashboardShellProps = {
  children: ReactNode;
  mainClassName?: string;
};

const DashboardShell = ({ children, mainClassName }: DashboardShellProps) => (
  // h-full (not min-h-full) on the grid caps it at the outer h-[100dvh] instead of
  // growing to fit tall page content — items-stretch then holds the sidebar to that
  // same fixed height instead of stretching past the viewport with it. <main> is the
  // one that scrolls internally (overflow-y-auto + min-h-0) when its content is tall;
  // the sidebar stays put.
  <div className="relative h-[100dvh] overflow-hidden text-white">
    <MobileDashboardBars />
    <div className={`h-full ${dashShellGridClass}`}>
      <DashboardSidebar />
      {/* min-[761px]:pt-3 lines every page's content top up with the sidebar logo's
          top edge (aside's own pt-2 + the logo row's pt-1 = 12px = pt-3), only where
          the sidebar is actually visible (mirrors dashRailLeftClass's 760px cutoff) —
          on mobile the fixed top bar already governs the offset, so this stays off there.
          No horizontal padding here on purpose: dashShellGridClass dropped its old
          right-side gutter so this element's own right border sits flush against the
          real window edge. Whichever descendant actually scrolls (main itself for
          pages with no inner wrapper, or a wrapper like dashPageContentWrapClass /
          dashHomeGridClass for the rest) supplies its own right padding instead, so its
          scrollbar renders at that flush edge rather than short of it. */}
      <main
        className={`flex min-h-0 min-w-0 flex-col overflow-y-auto min-[761px]:pt-3 ${mainClassName || ""}`}
      >
        {children}
      </main>
    </div>
  </div>
);

export default DashboardShell;
