import type { ReactNode } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { cx } from "./class-names";

type StateProps = {
  action?: ReactNode;
  className?: string;
  description?: string;
  title: string;
};

export function EmptyState({ action, className, description, title }: StateProps) {
  return (
    <div className={cx("grid min-h-40 place-items-center border-y border-gray-200 bg-gray-50 p-4", className)}>
      <div className="grid max-w-sm gap-3 text-center">
        <div>
          <p className="text-sm font-semibold text-gray-700">{title}</p>
          {description ? <p className="mt-1 text-sm leading-5 text-gray-500">{description}</p> : null}
        </div>
        {action ? <div className="flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}

export function ErrorState({ action, className, description, title }: StateProps) {
  return (
    <div className={cx("flex items-start gap-3 border-y border-gray-300 bg-gray-50 p-4", className)}>
      <AlertCircle aria-hidden="true" className="mt-0.5 size-4 text-gray-700" />
      <div className="grid min-w-0 gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-700">{title}</p>
          {description ? <p className="mt-1 text-sm leading-5 text-gray-500">{description}</p> : null}
        </div>
        {action}
      </div>
    </div>
  );
}

export function LoadingState({ className, description, title = "Loading" }: Partial<StateProps>) {
  return (
    <div className={cx("flex min-h-40 items-center justify-center gap-3 p-4 text-sm text-gray-500", className)}>
      <Loader2 aria-hidden="true" className="size-4 shrink-0 animate-spin" />
      <div className="grid gap-1 text-center">
        <span>{title}</span>
        {description ? <span className="text-xs leading-5 text-gray-500">{description}</span> : null}
      </div>
    </div>
  );
}
