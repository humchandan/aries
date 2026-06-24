export const dataTableConfig = {
  textOperators: [
    { label: "Equals", value: "eq" },
    { label: "Not Equals", value: "ne" },
    { label: "Contains", value: "contains" },
    { label: "Starts With", value: "startsWith" },
    { label: "Ends With", value: "endsWith" },
  ],
  numericOperators: [
    { label: "Equals", value: "eq" },
    { label: "Not Equals", value: "ne" },
    { label: "Greater Than", value: "gt" },
    { label: "Greater Than or Equals", value: "gte" },
    { label: "Less Than", value: "lt" },
    { label: "Less Than or Equals", value: "lte" },
  ],
  dateOperators: [
    { label: "Equals", value: "eq" },
    { label: "Not Equals", value: "ne" },
    { label: "After", value: "gt" },
    { label: "On or After", value: "gte" },
    { label: "Before", value: "lt" },
    { label: "On or Before", value: "lte" },
  ],
  booleanOperators: [
    { label: "Is True", value: "eq" },
    { label: "Is False", value: "ne" },
  ],
  selectOperators: [
    { label: "Equals", value: "eq" },
    { label: "Not Equals", value: "ne" },
  ],
  multiSelectOperators: [
    { label: "In", value: "in" },
    { label: "Not In", value: "notIn" },
  ],
} as any;
