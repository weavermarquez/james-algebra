import {
  cloneForm,
  FormId,
  FormNode,
} from "@/lib/james-algebra";

import { generateFormId, resetFormIdCounter } from "@/lib/james-algebra/ids";

import type { NetworkGraph, NetworkNode, NetworkEdge, NetworkNodeType } from "./types";

const NODE_BASE_SIZE = 1; // centimeters (abstract units)
const DIAMOND_SIZE = 0.7;
const VERTICAL_GAP = NODE_BASE_SIZE * 2;
const HORIZONTAL_GAP = NODE_BASE_SIZE * 2;

const parseNodeType = (node: FormNode): NetworkNodeType => {
  if (node.label.startsWith("container:")) {
    const boundary = node.label.split(":").at(1) ?? "";
    if (boundary === "round") return "round";
    if (boundary === "square") return "square";
    if (boundary === "angle") return "angle";
  }
  if (node.label.startsWith("atom:")) {
    return "atom";
  }
  return "atom";
};

type LayoutTree = {
  node: FormNode | null;
  depth: number;
  children: LayoutTree[];
  width: number;
  x: number;
};

const ensureIds = (node: FormNode): FormNode => {
  const clone = cloneForm(node);
  resetFormIdCounter();
  const visit = (current: FormNode) => {
    if (!current.id) {
      current.id = generateFormId();
    }
    current.children?.forEach((child) => visit(child));
  };
  visit(clone);
  return clone;
};

const buildTree = (node: FormNode, depth: number): LayoutTree => {
  if (node.label === "forest") {
    const children = node.children ?? [];
    const layoutChildren = children.map((child) => buildTree(child, depth));
    return {
      node: null,
      depth,
      children: layoutChildren,
      width: 1,
      x: 0,
    };
  }

  const childTrees = (node.children ?? []).map((child) => buildTree(child, depth + 1));

  return {
    node,
    depth,
    children: childTrees,
    width: 1,
    x: 0,
  };
};

const computeWidths = (tree: LayoutTree): number => {
  const childWidths = tree.children.map((child) => computeWidths(child));
  const childrenWidthSum = childWidths.reduce((sum, value) => sum + value, 0);
  const width = childWidths.length > 0 ? Math.max(childrenWidthSum, 1) : 1;
  tree.width = width;
  return width;
};

const assignPositions = (tree: LayoutTree, startX: number): void => {
  const center = startX + tree.width / 2;
  tree.x = center;

  let offset = startX;
  for (const child of tree.children) {
    assignPositions(child, offset);
    offset += child.width;
  }
};

const collectNodesAndEdges = (
  tree: LayoutTree,
  nodes: Map<FormId, NetworkNode>,
  edges: NetworkEdge[],
  parent?: LayoutTree,
) => {
  if (tree.node) {
    const id = tree.node.id as FormId;
    const type = parseNodeType(tree.node);
    const existing = nodes.get(id);
    const x = tree.x * HORIZONTAL_GAP;
    const y = tree.depth * VERTICAL_GAP;

    if (!existing) {
      nodes.set(id, {
        id,
        type,
        label: tree.node.label,
        depth: tree.depth,
        x,
        y,
      });
    }

    if (parent && parent.node) {
      edges.push({
        id: `${parent.node.id as FormId}->${id}`,
        from: parent.node.id as FormId,
        to: id,
      });
    }
  }

  for (const child of tree.children) {
    const edgeParent = tree.node ? tree : parent;
    collectNodesAndEdges(child, nodes, edges, edgeParent ?? tree);
  }
};

export const buildNetworkGraph = (form: FormNode): NetworkGraph => {
  const normalized = ensureIds(form);
  const tree = buildTree(normalized, 0);
  computeWidths(tree);
  assignPositions(tree, 0);

  const nodes = new Map<FormId, NetworkNode>();
  const edges: NetworkEdge[] = [];
  collectNodesAndEdges(tree, nodes, edges);

  return {
    nodes: Array.from(nodes.values()),
    edges,
  };
};

export { NODE_BASE_SIZE, DIAMOND_SIZE };
