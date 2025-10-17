import {
  Dot,
  makeEulerTree,
  treeFromEulerTree,
  TreeNode,
} from "tree-term-rewriting/src/tree";
import { Ordering } from "tree-term-rewriting/src/ordering";
import { applyRules, TermRewriteSystem } from "tree-term-rewriting/src/trs";

export type Boundary = "round" | "square" | "angle";

export type FormNode = {
  label: string;
  children?: FormNode[];
};

export const forest = (children: FormNode[] = []): FormNode => ({
  label: "forest",
  children,
});

export const container = (boundary: Boundary, child: FormNode): FormNode => ({
  label: `container:${boundary}`,
  children: [child],
});

export const atom = (name: string): FormNode => ({
  label: `atom:${name}`,
  children: [],
});

export const varRef = (name: string): FormNode => ({
  label: name,
  children: [],
});

export const wrapRound = (...forms: FormNode[]): FormNode =>
  container("round", forest(forms));

export const wrapSquare = (...forms: FormNode[]): FormNode =>
  container("square", forest(forms));

export const makeUnit = (): FormNode => wrapRound();

export const cloneTreeWithFreshIndices = (form: FormNode): TreeNode => {
  const state = { index: 1 };
  const walk = (node: FormNode): TreeNode => ({
    index: state.index++,
    value: node.label,
    children: (node.children ?? []).map(walk),
  });
  return walk(form);
};

export const cloneTree = (node: TreeNode): TreeNode => ({
  index: node.index,
  value: node.value,
  children: node.children.map(cloneTree),
});

export const reindexTree = (node: TreeNode, startIndex = 1): TreeNode => {
  const state = { index: startIndex };
  const walk = (current: TreeNode): TreeNode => {
    const index = state.index++;
    const children = current.children.map(walk);
    return { index, value: current.value, children };
  };
  return walk(node);
};

export const flattenForestNodes = (node: TreeNode): void => {
  node.children = node.children.flatMap((child) => {
    flattenForestNodes(child);
    if (node.value === "forest" && child.value === "forest") {
      return child.children;
    }
    return [child];
  });
};

export const prepareTreeForDisplay = (
  tree: TreeNode,
  startIndex = 1,
): TreeNode => {
  const copy = cloneTree(tree);
  flattenForestNodes(copy);
  return reindexTree(copy, startIndex);
};

export const toReadable = (node: TreeNode): unknown => {
  if (node.value === "forest") {
    return node.children.map(toReadable);
  }

  if (node.value.startsWith("container:")) {
    const boundary = node.value.split(":").at(1) ?? "";
    const content = node.children[0];
    return {
      boundary,
      children: content ? toReadable(content) : [],
    };
  }

  if (node.value.startsWith("atom:")) {
    return node.value.slice(5);
  }

  if (node.value.startsWith("$")) {
    return { variable: node.value };
  }

  return {
    value: node.value,
    children: node.children.map(toReadable),
  };
};

export const formToReadable = (form: FormNode): unknown => {
  const tree = cloneTreeWithFreshIndices(form);
  const displayTree = prepareTreeForDisplay(tree);
  return toReadable(displayTree);
};

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
];

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

export type GraphTreeEntry = {
  name: string;
  tree: TreeNode;
  startIndex?: number;
};

export const buildGraphLink = (
  title: string,
  trees: GraphTreeEntry[],
): string => {
  const dot = new Dot(title);
  trees.forEach((entry, offset) => {
    const baseIndex = entry.startIndex ?? offset * 100 + 1;
    const prepared = prepareTreeForDisplay(entry.tree, baseIndex);
    dot.addTree(entry.name, prepared);
  });
  return `https://dreampuf.github.io/GraphvizOnline/#${encodeURIComponent(dot.text)}`;
};

export const isGraphEmissionEnabled = (): boolean => {
  if (typeof Bun === "undefined") {
    return false;
  }
  return Bun.env?.JAMES_EMIT_GRAPHS === "1";
};

export const maybeEmitGraphLink = (
  title: string,
  trees: GraphTreeEntry[],
  shouldEmit = isGraphEmissionEnabled(),
): void => {
  if (!shouldEmit) {
    return;
  }
  const link = buildGraphLink(title, trees);
  console.log(`${title}: ${link}`);
};

export const formsToGraphTrees = (
  forms: { name: string; form: FormNode }[],
): GraphTreeEntry[] =>
  forms.map(({ name, form }) => ({
    name,
    tree: cloneTreeWithFreshIndices(form),
  }));
