"use client";

import {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";
import {
  appDropdownActionLabelClass,
  appDropdownActionLabelCompactClass,
  appDropdownContentClass,
  appDropdownDangerActionButtonClass,
  appDropdownDividerClass,
  appDropdownIconChipBaseClass,
  appDropdownIconChipCompactBaseClass,
  appDropdownQuietActionButtonClass,
  appDropdownQuietActionButtonCompactClass,
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

type DropdownIconChipProps = HTMLAttributes<HTMLDivElement> & {
  compact?: boolean;
};

type DropdownActionRowProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  icon: ReactNode;
  label: ReactNode;
  variant?: "quiet" | "danger";
  iconChipClassName?: string;
  labelClassName?: string;
  compact?: boolean;
};

type DropdownHeaderRowProps = HTMLAttributes<HTMLDivElement> & {
  avatar: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  secondary?: ReactNode;
  contentClassName?: string;
  titleClassName?: string;
  metaClassName?: string;
  secondaryClassName?: string;
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
  compact = false,
  ...props
}: DropdownIconChipProps) => (
  <div
    className={joinClassNames(
      compact ? appDropdownIconChipCompactBaseClass : appDropdownIconChipBaseClass,
      className
    )}
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
  compact = false,
  type = "button",
  ...props
}: DropdownActionRowProps) => (
  <button
    type={type}
    className={joinClassNames(
      variant === "danger"
        ? appDropdownDangerActionButtonClass
        : compact
          ? appDropdownQuietActionButtonCompactClass
          : appDropdownQuietActionButtonClass,
      className
    )}
    {...props}
  >
    <DropdownIconChip compact={compact} className={iconChipClassName}>
      {icon}
    </DropdownIconChip>
    <span
      className={joinClassNames(
        compact ? appDropdownActionLabelCompactClass : appDropdownActionLabelClass,
        labelClassName
      )}
    >
      {label}
    </span>
  </button>
);

export const DropdownHeaderRow = ({
  avatar,
  title,
  meta,
  secondary,
  className,
  contentClassName,
  titleClassName,
  metaClassName,
  secondaryClassName,
  ...props
}: DropdownHeaderRowProps) => (
  <DropdownRow className={className} {...props}>
    {avatar}
    <div
      className={joinClassNames(
        "flex min-w-0 flex-1 flex-col justify-center",
        contentClassName
      )}
    >
      <h3 className={titleClassName}>{title}</h3>
      {meta ? <p className={metaClassName}>{meta}</p> : null}
      {secondary ? <p className={secondaryClassName}>{secondary}</p> : null}
    </div>
  </DropdownRow>
);
