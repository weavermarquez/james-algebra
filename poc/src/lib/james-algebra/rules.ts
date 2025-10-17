import { makeEulerTree, treeFromEulerTree, TreeNode } from "tree-term-rewriting/src/tree";
import { Ordering } from "tree-term-rewriting/src/ordering";
import { applyRules, TermRewriteSystem } from "tree-term-rewriting/src/trs";

import {
  Boundary,
  FormNode,
  container,
  forest,
  varRef,
  cloneTreeWithFreshIndices,
  prepareTreeForDisplay,
} from "./types";

export class NodeCountOrdering extends Ordering {
  private size(node: TreeNode): number {
    return 1 + node.children.reduce((sum, child) => sum + this.size(child), 0);
  }

  greaterThan(a: TreeNode, b: TreeNode): boolean {
    return this.size(a) > this.size(b);
  }
}

export const ordering = new NodeCountOrdering();

export const ruleDefinitions = [
  {
    name: "clarify_round_square",
    from: container("round", forest([container("square", varRef("$A"))])),
    to: varRef("$A"),
  },
  {
    name: "clarify_square_round",
    from: container("square", forest([container("round", varRef("$A"))])),
    to: varRef("$A"),
  },
] satisfies {
  name: string;
  from: FormNode;
  to: FormNode;
}[];

export const termRewriteSystem: TermRewriteSystem = {
  equations: [],
  rules: ruleDefinitions.map(({ from, to }) => ({
    from: makeEulerTree(cloneTreeWithFreshIndices(from)),
    to: makeEulerTree(cloneTreeWithFreshIndices(to)),
  })),
};

export const MAX_REWRITE_STEPS = 8;

export const rewriteForm = (
  form: FormNode,
  maxSteps = MAX_REWRITE_STEPS,
): TreeNode => {
  const startEuler = makeEulerTree(cloneTreeWithFreshIndices(form));
  const rewrittenEuler = applyRules(
    startEuler,
    termRewriteSystem,
    ordering,
    maxSteps,
  );
  return treeFromEulerTree(rewrittenEuler);
};

export const rewriteFormForDisplay = (
  form: FormNode,
  maxSteps = MAX_REWRITE_STEPS,
  startIndex = 1,
): TreeNode => {
  const tree = rewriteForm(form, maxSteps);
  return prepareTreeForDisplay(tree, startIndex);
};

export type { Boundary, FormNode };
