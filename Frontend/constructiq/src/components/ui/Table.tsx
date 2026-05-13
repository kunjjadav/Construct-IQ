import React from "react";
import Button from "./Button";

export interface ColumnDef<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string; // e.g., 'text-right' for financial columns
}

interface TableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  keyExtractor: (row: T) => string | number;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export default function Table<T>({
  columns,
  data,
  onRowClick,
  keyExtractor,
  page,
  totalPages,
  onPageChange,
}: TableProps<T>) {
  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-[var(--color-bg-elevated)] border-b border-[var(--color-border-subtle)]">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--color-border-subtle)]">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]"
                >
                  No data available.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={() => onRowClick?.(row)}
                  className={`
                    transition-colors duration-150 ease-out
                    ${onRowClick ? "cursor-pointer hover:bg-[var(--color-bg-interactive)]" : ""}
                  `}
                >
                  {columns.map((col, i) => (
                    <td
                      key={i}
                      className={`px-4 py-3 data-text text-[var(--color-text-secondary)] ${col.className || ""}`}
                    >
                      {typeof col.accessor === "function"
                        ? col.accessor(row)
                        : (row[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages !== undefined && totalPages > 1 && (
        <div className="flex items-center justify-between px-1 py-3">
          <span className="text-xs text-[var(--color-text-muted)]">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={page === 1}
              onClick={() => onPageChange?.((page || 1) - 1)}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={page === totalPages}
              onClick={() => onPageChange?.((page || 1) + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
