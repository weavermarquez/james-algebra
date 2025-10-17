import type { FormForest, FormPath, Rule, RuleMatch, RuleMatchMeta } from "./types";
import {
  cloneForest,
  forestsEqual,
  getFormAtPath,
  replaceFormAtPath,
  visitForms,
} from "./structure";

export function formatPath(path: FormPath): string {
  if (path.length === 0) return "root";
  return path.join(" › ");
}

export function enumerateMatches<M extends RuleMatchMeta>(
  rule: Rule<M>,
  forms: FormForest,
): RuleMatch<M>[] {
  return rule.matches(forms);
}

export async function applyRule<M extends RuleMatchMeta>(
  forms: FormForest,
  rule: Rule<M>,
  match: RuleMatch<M>,
): Promise<FormForest> {
  if (match.ruleId !== rule.id) {
    throw new Error(`Rule mismatch: expected ${rule.id}, received ${match.ruleId}`);
  }
  const workingCopy = cloneForest(forms);
  return rule.apply(workingCopy, match);
}

export function replaceNode(forms: FormForest, path: FormPath, replacement: FormForest[number]): FormForest {
  return replaceFormAtPath(forms, path, replacement);
}

export function locate(forms: FormForest, path: FormPath) {
  return getFormAtPath(forms, path);
}

export function isGoalReached(current: FormForest, goal: FormForest): boolean {
  return forestsEqual(current, goal);
}

export function findAllNodes(forms: FormForest) {
  const results: ReturnType<typeof getFormAtPath>[] = [];
  visitForms(forms, entry => {
    results.push(entry);
  });
  return results;
}
