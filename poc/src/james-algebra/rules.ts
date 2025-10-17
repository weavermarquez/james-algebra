import { round, square } from "./factories";
import { getFormAtPath, replaceFormAtPath, visitForms } from "./structure";
import { transformWithProlog } from "./prolog/engine";
import type { FormForest, FormPath, Rule, RuleMatch, RuleMatchMeta } from "./types";

interface SimpleMatchMeta extends RuleMatchMeta {
  path: FormPath;
}

function makeMatch(ruleId: string, path: FormPath, description: string): RuleMatch<SimpleMatchMeta> {
  return {
    ruleId,
    meta: {
      path,
      description,
    },
  };
}

const ENFOLD_RULE_ID = "axiom.enfold";

const enfoldRule: Rule<SimpleMatchMeta> = {
  id: ENFOLD_RULE_ID,
  label: "Enfold",
  summary: "Wrap a form in a round boundary containing a square boundary.",
  description:
    "Creates a new distinction around the selected form by nesting it inside a round container that holds a square frame.",
  matches(forms: FormForest) {
    const matches: RuleMatch<SimpleMatchMeta>[] = [];
    visitForms(forms, ({ node, path }) => {
      matches.push(makeMatch(ENFOLD_RULE_ID, path, `Enfold ${node.boundary} at ${path.join(" › ") || "root"}`));
    });
    return matches;
  },
  async apply(forms: FormForest, match: RuleMatch<SimpleMatchMeta>) {
    const target = getFormAtPath(forms, match.meta.path).node;
    const replacement = await transformWithProlog("enfold", target);
    return replaceFormAtPath(forms, match.meta.path, replacement);
  },
  exampleBefore: [round()],
  exampleAfter: [round(square(round()))],
  hints: ["This wraps the selected form with the round-then-square inversion shell."],
};

const CLARIFY_RULE_ID = "axiom.clarify";

const clarifyRule: Rule<SimpleMatchMeta> = {
  id: CLARIFY_RULE_ID,
  label: "Clarify",
  summary: "Remove an inversion pair ⟨round(square(X))⟩ to reveal X.",
  description: "Cancels a round container whose only child is a square container, exposing the inner form.",
  matches(forms: FormForest) {
    const matches: RuleMatch<SimpleMatchMeta>[] = [];
    visitForms(forms, ({ node, path }) => {
      if (node.boundary !== "round") return;
      if (node.children.length !== 1) return;
      const inner = node.children[0];
      if (inner.boundary !== "square") return;
      if (inner.children.length !== 1) return;
      matches.push(makeMatch(CLARIFY_RULE_ID, path, "Clarify inversion"));
    });
    return matches;
  },
  async apply(forms: FormForest, match: RuleMatch<SimpleMatchMeta>) {
    const { node } = getFormAtPath(forms, match.meta.path);
    const replacement = await transformWithProlog("clarify", node);
    return replaceFormAtPath(forms, match.meta.path, replacement);
  },
  exampleBefore: [round(square(round()))],
  exampleAfter: [round()],
  hints: ["Look for a round container that immediately holds a square container."],
};

export const RULES: Rule[] = [enfoldRule, clarifyRule];

export const RULES_BY_ID = Object.fromEntries(RULES.map(rule => [rule.id, rule]));

export function getRuleById(id: string): Rule | undefined {
  return RULES_BY_ID[id];
}
