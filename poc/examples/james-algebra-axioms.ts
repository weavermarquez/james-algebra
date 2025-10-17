import { Dot } from "tree-term-rewriting/src/tree";
import { makeEulerTree, treeFromEulerTree, TreeNode } from "tree-term-rewriting/src/tree";
import { Ordering } from "tree-term-rewriting/src/ordering";
import { applyRules, TermRewriteSystem } from "tree-term-rewriting/src/trs";

type Boundary = "round" | "square" | "angle";

type FormNode = {
  label: string;
  children?: FormNode[];
};

const forest = (children: FormNode[] = []): FormNode => ({
  label: "forest",
  children,
});

const container = (boundary: Boundary, child: FormNode): FormNode => ({
  label: `container:${boundary}`,
  children: [child],
});

const atom = (name: string): FormNode => ({
  label: `atom:${name}`,
  children: [],
});

const varRef = (name: string): FormNode => ({
  label: name,
  children: [],
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

const reindexTree = (node: TreeNode): TreeNode => {
  const state = { index: 1 };
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

const flattenForestNodes = (node: TreeNode): void => {
  node.children = node.children.flatMap((child) => {
    flattenForestNodes(child);
    if (node.value === "forest" && child.value === "forest") {
      return child.children;
    }
    return [child];
  });
};

const toReadable = (node: TreeNode): unknown => {
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
    from: container("round", forest([container("square", varRef("$A"))])),
    to: varRef("$A"),
  },
  {
    name: "clarify_square_round",
    from: container("square", forest([container("round", varRef("$A"))])),
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
  trees.forEach((entry, offset) => {
    const reindexed = reindexTree(entry.tree);
    flattenForestNodes(reindexed);
    dot.addTree(entry.name, reindexed);
  });
  console.log(`${title}: https://dreampuf.github.io/GraphvizOnline/#${encodeURIComponent(dot.text)}`);
};

const demonstrations: { name: string; form: FormNode }[] = [
  {
    name: "round_square_single",
    form: forest([
      container(
        "round",
        forest([
          container(
            "square",
            forest([
              atom("alpha"),
            ]),
          ),
        ]),
      ),
    ]),
  },
  {
    name: "round_square_multi",
    form: forest([
      container(
        "round",
        forest([
          container(
            "square",
            forest([
              atom("alpha"),
              atom("beta"),
              container("round", forest([atom("gamma")])),
            ]),
          ),
        ]),
      ),
    ]),
  },
  {
    name: "square_round_single",
    form: forest([
      container(
        "square",
        forest([
          container(
            "round",
            forest([
              atom("beta"),
            ]),
          ),
        ]),
      ),
    ]),
  },
];

for (const rule of ruleDefinitions) {
  const fromTree = cloneTreeWithFreshIndices(rule.from);
  const toTree = cloneTreeWithFreshIndices(rule.to);
  printGraphLink(`Rule ${rule.name}`, [
    { name: "From", tree: fromTree },
    { name: "To", tree: toTree },
  ]);
}

for (const demo of demonstrations) {
  const beforeTree = cloneTreeWithFreshIndices(demo.form);
  const beforeDisplay = reindexTree(beforeTree);
  flattenForestNodes(beforeDisplay);

  const beforeEuler = makeEulerTree(beforeTree);
  const rewrittenEuler = applyRules(beforeEuler, termRewriteSystem, ordering, 8);
  const afterTree = treeFromEulerTree(rewrittenEuler);
  flattenForestNodes(afterTree);

  const afterDisplay = reindexTree(afterTree);

  printGraphLink(`Demo ${demo.name}`, [
    { name: "Before", tree: beforeDisplay },
    { name: "After", tree: afterDisplay },
  ]);

  console.log(`Before ${demo.name}:`, JSON.stringify(toReadable(beforeDisplay), null, 2));
  console.log(`After ${demo.name}:`, JSON.stringify(toReadable(afterDisplay), null, 2));
}
