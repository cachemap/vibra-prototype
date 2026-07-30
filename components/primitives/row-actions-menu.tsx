"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { ActionMenu } from "./action-menu";
import { MenuGroup, MenuItem } from "./menu";

const rowActionsMenuOpenEvent = "vibra:row-actions-menu-open";

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
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const setMenuOpen = (next: boolean) => {
    if (next) {
      window.dispatchEvent(new CustomEvent(rowActionsMenuOpenEvent, { detail: menuId }));
    }

    setOpen(next);
  };

  useEffect(() => {
    const closeWhenAnotherMenuOpens = (event: Event) => {
      if (event instanceof CustomEvent && event.detail !== menuId) {
        setOpen(false);
      }
    };

    window.addEventListener(rowActionsMenuOpenEvent, closeWhenAnotherMenuOpens);

    return () => {
      window.removeEventListener(rowActionsMenuOpenEvent, closeWhenAnotherMenuOpens);
    };
  }, [menuId]);

  const menuItems = items.map((item) => (
    <MenuItem
      destructive={item.destructive}
      icon={item.icon}
      key={item.label}
      onClick={() => {
        setMenuOpen(false);
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
      onOpenChange={setMenuOpen}
      open={open}
      size={size}
    >
      {grouped ? <MenuGroup>{menuItems}</MenuGroup> : menuItems}
    </ActionMenu>
  );
}
