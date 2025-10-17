import { Dot } from "tree-term-rewriting/src/tree";
import { makeEulerTree, treeFromEulerTree, TreeNode } from "tree-term-rewriting/src/tree";
import { Ordering } from "tree-term-rewriting/src/ordering";
import { applyRules, TermRewriteSystem } from "tree-term-rewriting/src/trs";

/**
 * Minimal tree vocabulary for James Algebra forms.
 */
type FormNode = {
  label: string;
  children?: FormNode[];
};

const container = (boundary: "round" | "square" | "angle", children: FormNode[] = []): FormNode => ({
  label: `container:${boundary}`,
  children,
});

const atom = (name: string): FormNode => ({
  label: `atom:${name}`,
});

const varRef = (name: string): FormNode => ({
  label: name,
});

const cloneTreeWithFreshIndices = (form: FormNode): TreeNode => {
  const state = { index: 1 };
  const walk = (node: FormNode): TreeNode => ({
    index: state.index++,
    value: node.label,
    children: (node.children ?? []).map(walk),
  });
  return walk(form);
};

const cloneTreeNodeWithOffset = (node: TreeNode, offset: number): TreeNode => ({
  index: node.index + offset,
  value: node.value,
  children: node.children.map((child) => cloneTreeNodeWithOffset(child, offset)),
});

const reindexTreeNode = (node: TreeNode, startIndex: number): TreeNode => {
  const state = { index: startIndex };
  const walk = (current: TreeNode): TreeNode => {
    const next: TreeNode = {
      index: state.index++,
      value: current.value,
      children: [],
    };
    next.children = current.children.map(walk);
    return next;
  };
  return walk(node);
};

const toPlainObject = (node: TreeNode) => ({
  value: node.value,
  children: node.children.map(toPlainObject),
});

class NodeCountOrdering extends Ordering {
  private size(node: TreeNode): number {
    return 1 + node.children.reduce((sum, child) => sum + this.size(child), 0);
  }

  greaterThan(a: TreeNode, b: TreeNode): boolean {
    return this.size(a) > this.size(b);
  }
}

const ordering = new NodeCountOrdering();

const ruleDefinitions = [
  {
    name: "clarify_round_square",
    from: container("round", [container("square", [varRef("$A")])]),
    to: varRef("$A"),
  },
  {
    name: "clarify_square_round",
    from: container("square", [container("round", [varRef("$A")])]),
    to: varRef("$A"),
  },
];

const termRewriteSystem: TermRewriteSystem = {
  equations: [],
  rules: ruleDefinitions.map(({ from, to }) => ({
    from: makeEulerTree(cloneTreeWithFreshIndices(from)),
    to: makeEulerTree(cloneTreeWithFreshIndices(to)),
  })),
};

const printGraphLink = (title: string, trees: { name: string; tree: TreeNode }[]) => {
  const dot = new Dot(title);
  trees.forEach((entry, index) => {
    const reindexed = reindexTreeNode(entry.tree, index * 100 + 1);
    dot.addTree(entry.name, reindexed);
  });
  console.log(`${title}: https://dreampuf.github.io/GraphvizOnline/#${encodeURIComponent(dot.text)}`);
};

const demonstrations = [
  {
    name: "round_square_alpha",
    form: container("round", [container("square", [atom("alpha")])]),
  },
  {
    name: "square_round_beta",
    form: container("square", [container("round", [atom("beta")])]),
  },
];

for (const rule of ruleDefinitions) {
  const fromTree = cloneTreeWithFreshIndices(rule.from);
  const toTree = cloneTreeWithFreshIndices(rule.to);
  printGraphLink(`Rule: ${rule.name}`, [
    { name: "From", tree: fromTree },
    { name: "To", tree: toTree },
  ]);
}

for (const demo of demonstrations) {
  const beforeTree = cloneTreeWithFreshIndices(demo.form);
  const beforeEuler = makeEulerTree(beforeTree);
  const rewrittenEuler = applyRules(beforeEuler, termRewriteSystem, ordering, 4);
  const afterTree = treeFromEulerTree(rewrittenEuler);
  printGraphLink(`Demo: ${demo.name}`, [
    { name: "Before", tree: beforeTree },
    { name: "After", tree: afterTree },
  ]);
  console.log(`Before ${demo.name}:`, JSON.stringify(toPlainObject(beforeTree), null, 2));
  console.log(`After ${demo.name}:`, JSON.stringify(toPlainObject(afterTree), null, 2));
}
