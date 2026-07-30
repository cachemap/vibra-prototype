"use client";

import { useState, type ReactNode } from "react";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { ActionMenu } from "./action-menu";
import { MenuGroup, MenuItem } from "./menu";

export type RowActionsMenuItem = {
  destructive?: boolean;
  icon?: ReactNode;
  label: string;
  onSelect: () => void;
};

type RowActionsMenuProps = {
  align?: "end" | "start";
  disabled?: boolean;
  grouped?: boolean;
  icon?: LucideIcon;
  items: readonly RowActionsMenuItem[];
  label: string;
  size?: "compact" | "default";
};

export function RowActionsMenu({
  align,
  disabled,
  grouped,
  icon = MoreHorizontal,
  items,
  label,
  size
}: RowActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const menuItems = items.map((item) => (
    <MenuItem
      destructive={item.destructive}
      icon={item.icon}
      key={item.label}
      onClick={() => {
        setOpen(false);
        item.onSelect();
      }}
    >
      {item.label}
    </MenuItem>
  ));

  return (
    <ActionMenu
      align={align}
      disabled={disabled}
      icon={icon}
      label={label}
      onOpenChange={setOpen}
      open={open}
      size={size}
    >
      {grouped ? <MenuGroup>{menuItems}</MenuGroup> : menuItems}
    </ActionMenu>
  );
}
