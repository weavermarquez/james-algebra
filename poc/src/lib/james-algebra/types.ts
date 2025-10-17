import { TreeNode } from "tree-term-rewriting/src/tree";

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

export const cloneForm = (node: FormNode): FormNode => ({
  label: node.label,
  children: node.children?.map(cloneForm),
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
