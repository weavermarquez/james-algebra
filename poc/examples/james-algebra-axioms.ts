import {
  Dot,
  makeEulerTree,
  TreeNode,
} from "tree-term-rewriting/src/tree";
import { Ordering } from "tree-term-rewriting/src/ordering";
import { TermRewriteSystem } from "tree-term-rewriting/src/trs";

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

export const cloneTreeWithFreshIndices = (form: FormNode): TreeNode => {
  const state = { index: 1 };
  const walk = (node: FormNode): TreeNode => ({
    index: state.index++,
    value: node.label,
    children: (node.children ?? []).map(walk),
  });
  return walk(form);
};

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

export const printGraphLink = (
  title: string,
  trees: { name: string; tree: TreeNode }[],
) => {
  const dot = new Dot(title);
  trees.forEach((entry, offset) => {
    const baseIndex = offset * 100 + 1;
    const reindexed = reindexTree(entry.tree, baseIndex);
    flattenForestNodes(reindexed);
    dot.addTree(entry.name, reindexed);
  });
  console.log(
    `${title}: https://dreampuf.github.io/GraphvizOnline/#${encodeURIComponent(dot.text)}`,
  );
};

