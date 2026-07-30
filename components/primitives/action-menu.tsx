"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode
} from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { IconButton } from "./icon-button";
import { Menu } from "./menu";

type ActionMenuProps = {
  align?: "end" | "start";
  children: ReactNode;
  disabled?: boolean;
  icon?: LucideIcon;
  label: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  placement?: "dropdown" | "side";
  size?: "compact" | "default";
};

const subscribeToNothing = () => () => {};
const viewportPadding = 8;
const triggerGap = 6;
const fallbackMenuWidth = 150;

type ActionMenuPositionInput = {
  align: "end" | "start";
  menuSize: { height: number; width: number };
  placement: "dropdown" | "side";
  triggerRect: DOMRect;
  viewportHeight: number;
  viewportWidth: number;
};

export function positionActionMenu({
  align,
  menuSize,
  placement,
  triggerRect,
  viewportHeight,
  viewportWidth
}: ActionMenuPositionInput) {
  const measuredWidth = menuSize.width || fallbackMenuWidth;
  const measuredHeight = menuSize.height || 0;
  const maxLeft = viewportWidth - measuredWidth - viewportPadding;
  const clampLeft = (left: number) =>
    Math.min(Math.max(viewportPadding, left), Math.max(viewportPadding, maxLeft));
  const clampTop = (top: number) => {
    if (measuredHeight === 0) {
      return Math.max(viewportPadding, top);
    }

    const maxTop = viewportHeight - measuredHeight - viewportPadding;

    return Math.min(Math.max(viewportPadding, top), Math.max(viewportPadding, maxTop));
  };

  if (placement === "side") {
    const sideCandidates =
      align === "end"
        ? [
            triggerRect.left - measuredWidth - triggerGap,
            triggerRect.right + triggerGap
          ]
        : [
            triggerRect.right + triggerGap,
            triggerRect.left - measuredWidth - triggerGap
          ];
    const sideLeft = sideCandidates.find(
      (candidate) =>
        candidate >= viewportPadding &&
        candidate + measuredWidth <= viewportWidth - viewportPadding
    );

    if (sideLeft !== undefined) {
      return {
        left: sideLeft,
        top: clampTop(triggerRect.top)
      };
    }
  }

  const spaceBelow = viewportHeight - triggerRect.bottom;
  const spaceAbove = triggerRect.top;
  const requiredHeight = measuredHeight + triggerGap + viewportPadding;
  const placeAbove =
    measuredHeight > 0 && spaceBelow < requiredHeight && spaceAbove > requiredHeight;
  const top = placeAbove
    ? triggerRect.top - measuredHeight - triggerGap
    : triggerRect.bottom + triggerGap;
  const preferredLeft = align === "end" ? triggerRect.right - measuredWidth : triggerRect.left;

  return {
    left: clampLeft(preferredLeft),
    top: clampTop(top)
  };
}

/**
 * Row/tile overflow menu. The menu is portalled to the document body and positioned
 * with fixed coordinates so it floats above the page instead of being clipped by an
 * ancestor that scrolls (tables, tile grids, and the page header action slot all do).
 */
export function ActionMenu({
  align = "end",
  children,
  disabled,
  icon = MoreHorizontal,
  label,
  onOpenChange,
  open,
  placement = "dropdown",
  size = "default"
}: ActionMenuProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const [menuSize, setMenuSize] = useState({ height: 0, width: 0 });
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const syncTriggerRect = () => {
      const element = triggerRef.current;

      if (element) {
        setTriggerRect(element.getBoundingClientRect());
      }
    };

    syncTriggerRect();
    window.addEventListener("resize", syncTriggerRect);
    window.addEventListener("scroll", syncTriggerRect, true);

    return () => {
      window.removeEventListener("resize", syncTriggerRect);
      window.removeEventListener("scroll", syncTriggerRect, true);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !menuRef.current) {
      return;
    }

    const { height, width } = menuRef.current.getBoundingClientRect();

    setMenuSize((current) =>
      current.height === height && current.width === width ? current : { height, width }
    );
  }, [open, triggerRect]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node | null;

      if (!target) {
        return;
      }

      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target) ||
        (target instanceof Element && target.closest("[data-action-menu-trigger='true']"))
      ) {
        return;
      }

      onOpenChange(false);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onOpenChange, open]);

  const renderMenu = () => {
    if (!mounted || !open || !triggerRect) {
      return null;
    }

    // Responsive screens render the same row twice (desktop table plus mobile card list) and
    // hide one with `display: none`, which reports a zero rect. Without this guard the hidden
    // twin renders a duplicate menu pinned to the viewport corner.
    if (triggerRect.width === 0 && triggerRect.height === 0) {
      return null;
    }

    const { left, top } = positionActionMenu({
      align,
      menuSize,
      placement,
      triggerRect,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth
    });

    return createPortal(
      <div
        className="fixed z-50"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        ref={menuRef}
        style={{ left, top }}
      >
        <Menu>{children}</Menu>
      </div>,
      document.body
    );
  };

  return (
    <span className="inline-flex" ref={triggerRef}>
      <IconButton
        aria-expanded={open}
        aria-haspopup="menu"
        data-action-menu-trigger="true"
        disabled={disabled}
        icon={icon}
        label={label}
        onClick={(event) => {
          event.stopPropagation();
          onOpenChange(!open);
        }}
        size={size}
      />
      {renderMenu()}
    </span>
  );
}
