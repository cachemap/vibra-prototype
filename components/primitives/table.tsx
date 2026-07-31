import { forwardRef, type HTMLAttributes, type TableHTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { cx } from "./class-names";

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto border-y border-gray-300">
      <table className={cx("w-full border-collapse text-sm text-gray-700", className)} {...props} />
    </div>
  );
}

export function TableHead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className="bg-gray-50 text-xs font-medium text-gray-500" {...props} />;
}

export function TableBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className="divide-y divide-gray-200 bg-gray-25" {...props} />;
}

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => <tr className={cx("h-10 transition-colors", className)} ref={ref} {...props} />
);

TableRow.displayName = "TableRow";

export function TableHeaderCell({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cx("h-10 whitespace-nowrap px-3 text-left align-middle font-medium", className)}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cx("h-10 px-3 align-middle tabular-nums", className)} {...props} />;
}
