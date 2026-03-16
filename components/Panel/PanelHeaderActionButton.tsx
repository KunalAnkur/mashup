"use client";

import { ButtonHTMLAttributes, PropsWithChildren } from "react";

type PanelHeaderActionButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement>
>;

const PanelHeaderActionButton = ({
  children,
  className = "",
  type = "button",
  ...props
}: PanelHeaderActionButtonProps) => {
  return (
    <button
      type={type}
      className={`relative rounded-xl border-0 p-2 outline-none transition-all duration-200 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default PanelHeaderActionButton;
