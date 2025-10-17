export type BoundaryKind = "round" | "square" | "angle";

export interface Form {
  boundary: BoundaryKind;
  children: Form[];
}

export type FormForest = Form[];

export type FormPath = number[];

export interface RuleMatchMeta {
  path: FormPath;
  description?: string;
}

export interface RuleMatch<M extends RuleMatchMeta = RuleMatchMeta> {
  ruleId: string;
  meta: M;
}

export interface Rule<M extends RuleMatchMeta = RuleMatchMeta> {
  id: string;
  label: string;
  summary: string;
  description?: string;
  matches: (forms: FormForest) => RuleMatch<M>[];
  apply: (forms: FormForest, match: RuleMatch<M>) => FormForest;
  exampleBefore?: FormForest;
  exampleAfter?: FormForest;
  hints?: string[];
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  goalSummary: string;
  initialForms: FormForest;
  goalForms: FormForest;
  allowedRuleIds: string[];
  hints: string[];
}
