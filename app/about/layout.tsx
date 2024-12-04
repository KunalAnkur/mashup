import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      header
      {children}
      footer
    </div>
  );
};

export default layout;
