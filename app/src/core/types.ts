export type FieldHelper = {
  title: string;
  type: 'dynamic_sum' | 'formula';
  fields?: {k: string, l: string, u: string}[]; // used for formula
  solver?: (v: Record<string, number | null>) => number | null; // used for formula
};

export type FieldDefinition = {
  k: string;
  l: string;
  u: string;
  helper?: FieldHelper;
};

export type AccountingModuleDef = {
  id: string;
  title: string;
  icon: string;
  color: string;
  desc: string;
  fields: FieldDefinition[];
  solver: (v: Record<string, number | null>) => Record<string, number | null | string>;
  formula: string;
  latex?: string;
};

export type AccountingNodeData = {
  defId: string;
  vals: Record<string, number | null>;
  calcKeys: string[];
  manualKeys: string[];
  inheritedKeys?: string[];
  helpersVals?: Record<string, Record<string, unknown>>;
  error?: string;
  decision?: string;
};
