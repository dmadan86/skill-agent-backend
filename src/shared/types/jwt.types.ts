type UnitAnyCase = "ms" | "s" | "m" | "h" | "d" | "w" | "y"; // Add more if needed

export type StringValue =
  | `${number}`
  | `${number}${UnitAnyCase}`
  | `${number} ${UnitAnyCase}`;
