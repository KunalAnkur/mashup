"use client";

import {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";
import {
  appDropdownActionLabelClass,
  appDropdownContentClass,
  appDropdownDangerActionButtonClass,
  appDropdownDividerClass,
  appDropdownIconChipBaseClass,
  appDropdownQuietActionButtonClass,
  appDropdownRowClass,
  appDropdownSurfaceClass,
} from "./classTokens";

const joinClassNames = (...classNames: Array<string | undefined>) =>
  classNames.filter(Boolean).join(" ");

type DropdownPanelProps = HTMLAttributes<HTMLDivElement> & {
  contentClassName?: string;
};

type DropdownRowProps = HTMLAttributes<HTMLDivElement>;

type DropdownDividerProps = HTMLAttributes<HTMLDivElement>;

type DropdownIconChipProps = HTMLAttributes<HTMLDivElement>;

type DropdownActionRowProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  icon: ReactNode;
  label: ReactNode;
  variant?: "quiet" | "danger";
  iconChipClassName?: string;
  labelClassName?: string;
};

export const DropdownPanel = ({
  children,
  className,
  contentClassName,
  ...props
}: DropdownPanelProps) => (
  <div className={joinClassNames(appDropdownSurfaceClass, className)} {...props}>
    <div className={joinClassNames(appDropdownContentClass, contentClassName)}>
      {children}
    </div>
  </div>
);

export const DropdownRow = ({
  children,
  className,
  ...props
}: DropdownRowProps) => (
  <div className={joinClassNames(appDropdownRowClass, className)} {...props}>
    {children}
  </div>
);

export const DropdownDivider = ({
  className,
  ...props
}: DropdownDividerProps) => (
  <div className={joinClassNames(appDropdownDividerClass, className)} {...props} />
);

export const DropdownIconChip = ({
  children,
  className,
  ...props
}: DropdownIconChipProps) => (
  <div
    className={joinClassNames(appDropdownIconChipBaseClass, className)}
    {...props}
  >
    {children}
  </div>
);

export const DropdownActionRow = ({
  icon,
  label,
  variant = "quiet",
  className,
  iconChipClassName,
  labelClassName,
  type = "button",
  ...props
}: DropdownActionRowProps) => (
  <button
    type={type}
    className={joinClassNames(
      variant === "danger"
        ? appDropdownDangerActionButtonClass
        : appDropdownQuietActionButtonClass,
      className
    )}
    {...props}
  >
    <DropdownIconChip className={iconChipClassName}>{icon}</DropdownIconChip>
    <span
      className={joinClassNames(appDropdownActionLabelClass, labelClassName)}
    >
      {label}
    </span>
  </button>
);
