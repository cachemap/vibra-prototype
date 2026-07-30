"use client";

import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";
import { Dialog, DialogOverlay } from "./dialog";

type ConfirmDialogProps = {
  cancelLabel?: string;
  cascadeSummary?: ReactNode;
  children?: ReactNode;
  confirmLabel?: string;
  disabled?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  open?: boolean;
  title: string;
};

export function ConfirmDialog({
  cancelLabel = "Cancel",
  cascadeSummary,
  children,
  confirmLabel = "Delete",
  disabled,
  onCancel,
  onConfirm,
  open = true,
  title
}: ConfirmDialogProps) {
  return (
    <DialogOverlay open={open}>
      <Dialog
        actions={
          <>
            <Button disabled={disabled} onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button
              disabled={disabled}
              leftIcon={<AlertTriangle aria-hidden="true" size={16} />}
              onClick={onConfirm}
              variant="destructive"
            >
              {confirmLabel}
            </Button>
          </>
        }
        title={title}
      >
        <div className="space-y-4 text-sm leading-5 text-gray-600">
          {children ? <div>{children}</div> : null}
          {cascadeSummary ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs font-semibold uppercase text-gray-500">Also removed</div>
              <div className="mt-2 text-gray-700">{cascadeSummary}</div>
            </div>
          ) : null}
        </div>
      </Dialog>
    </DialogOverlay>
  );
}
