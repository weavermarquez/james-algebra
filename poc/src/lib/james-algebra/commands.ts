import { Boundary, FormNode, container, forest, cloneForm } from "./types";

export type ForestPath = number[];

export type EnfoldSelection = {
  path: ForestPath;
  start: number;
  end: number;
  boundary: Boundary;
  innerBoundary?: Boundary;
  payload?: FormNode[];
};

const complementBoundary = (boundary: Boundary): Boundary => {
  if (boundary === "round") {
    return "square";
  }
  if (boundary === "square") {
    return "round";
  }
  return boundary;
};

const assertForestNode = (node: FormNode): void => {
  if (node.label !== "forest") {
    throw new Error(`Expected forest node, received ${node.label}`);
  }
};

const cloneWithEnfold = (
  node: FormNode,
  selection: EnfoldSelection,
  depth: number,
): FormNode => {
  if (depth === selection.path.length) {
    assertForestNode(node);
    const children = node.children ?? [];
    const { start, end } = selection;

    if (start < 0 || start > children.length) {
      throw new Error(`Enfold start index ${start} is out of bounds for forest of size ${children.length}`);
    }
    if (end < start || end > children.length) {
      throw new Error(`Enfold end index ${end} is out of bounds for forest of size ${children.length}`);
    }

    const before = children.slice(0, start).map(cloneForm);
    const selected = children.slice(start, end).map(cloneForm);
    const after = children.slice(end).map(cloneForm);

    const contentSource = selection.payload?.map(cloneForm) ?? selected;

    const innerBoundary = selection.innerBoundary ?? complementBoundary(selection.boundary);
    const innerContainer = container(innerBoundary, forest(contentSource));
    const outerContainer = container(selection.boundary, forest([innerContainer]));

    return {
      label: node.label,
      children: [...before, outerContainer, ...after],
    };
  }

  const index = selection.path[depth];
  const children = node.children ?? [];
  if (index < 0 || index >= children.length) {
    throw new Error(`Enfold path index ${index} is out of bounds for node ${node.label}`);
  }

  return {
    label: node.label,
    children: children.map((child, childIndex) =>
      childIndex === index
        ? cloneWithEnfold(child, selection, depth + 1)
        : cloneForm(child),
    ),
  };
};

export const enfoldSelection = (
  form: FormNode,
  selection: EnfoldSelection,
): FormNode => {
  if (selection.path.length === 0 && form.label !== "forest") {
    throw new Error(`Top-level form must be a forest to enfold, received ${form.label}`);
  }
  return cloneWithEnfold(form, selection, 0);
};
