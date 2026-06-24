import type { ColumnSort } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends import("@tanstack/react-table").RowData, TValue> {
    options?: any;
  }
}

export type ExtendedColumnSort<TData> = ColumnSort & {
  desc: boolean;
  id: Extract<keyof TData, string>;
};

export type FilterOperator =
  | "eq"
  | "ne"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "notIn"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "isEmpty"
  | "isNotEmpty";

export type FilterVariant = "text" | "number" | "date" | "boolean" | "select" | "multiSelect" | "range" | "dateRange";

export type ExtendedColumnFilter<TData> = {
  id: Extract<keyof TData, string>;
  value: any;
  operator?: FilterOperator;
  variant?: FilterVariant;
};
