import type { FormEventHandler, ReactNode } from "react";
import { Button } from "./button";
import { cx } from "./class-names";
import { Dialog } from "./dialog";

type FormDialogProps = {
  cancelLabel?: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  formId: string;
  onCancel: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  open?: boolean;
  size?: "default" | "wide";
  submitLabel: string;
  title: string;
};

export function FormDialog({
  cancelLabel = "Cancel",
  children,
  className,
  disabled,
  formId,
  onCancel,
  onSubmit,
  open,
  size,
  submitLabel,
  title
}: FormDialogProps) {
  return (
    <Dialog
      actions={
        <>
          <Button onClick={onCancel}>{cancelLabel}</Button>
          <Button disabled={disabled} form={formId} type="submit" variant="primary">
            {submitLabel}
          </Button>
        </>
      }
      open={open}
      size={size}
      title={title}
    >
      <form className={cx("grid gap-4", className)} id={formId} onSubmit={onSubmit}>
        {children}
      </form>
    </Dialog>
  );
}
