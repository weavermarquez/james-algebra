import { Boundary, FormNode, FormId, container, forest, cloneForm } from "./types";

export type ForestPath = number[];

export type EnfoldSelection = {
  path: ForestPath;
  selectedIds: FormId[];
  boundary: Boundary;
  payload?: FormNode[];
  insertBeforeId?: FormId | null;
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
    const idToIndex = new Map(
      children.map((child, index) => {
        if (!child.id) {
          throw new Error("Encountered a child node without an id.");
        }
        return [child.id, index] as const;
      }),
    );

    const orderedIndices = selection.selectedIds
      .map((id) => {
        const index = idToIndex.get(id);
        if (index === undefined) {
          throw new Error(
            `Selected node ${id} could not be found within the targeted forest.`,
          );
        }
        return index;
      })
      .sort((a, b) => a - b);

    const hasSelection = orderedIndices.length > 0;

    for (let i = 1; i < orderedIndices.length; i += 1) {
      if (orderedIndices[i] !== orderedIndices[i - 1] + 1) {
        throw new Error("Selected nodes must form a contiguous span within the forest.");
      }
    }

    let start: number;
    let end: number;

    if (hasSelection) {
      start = orderedIndices[0];
      end = orderedIndices[orderedIndices.length - 1] + 1;
    } else {
      if (selection.insertBeforeId === undefined) {
        throw new Error(
          "insertBeforeId must be provided when no nodes are selected for enfolding.",
        );
      }

      if (selection.insertBeforeId === null) {
        start = children.length;
      } else {
        const beforeIndex = idToIndex.get(selection.insertBeforeId);
        if (beforeIndex === undefined) {
          throw new Error(
            `insertBeforeId ${selection.insertBeforeId} could not be found in the target forest.`,
          );
        }
        start = beforeIndex;
      }
      end = start;
    }

    const before = children.slice(0, start).map(cloneForm);
    const selectedClones = children.slice(start, end).map(cloneForm);
    const after = children.slice(end).map(cloneForm);

    const contentSource = selection.payload?.map(cloneForm) ?? selectedClones;

    const innerBoundary = complementBoundary(selection.boundary);
    const innerContainer = container(innerBoundary, forest(contentSource));
    const outerContainer = container(selection.boundary, forest([innerContainer]));

    return {
      ...node,
      children: [...before, outerContainer, ...after],
    };
  }

  const index = selection.path[depth];
  const children = node.children ?? [];
  if (index < 0 || index >= children.length) {
    throw new Error(`Enfold path index ${index} is out of bounds for node ${node.label}`);
  }

  return {
    ...node,
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
  return cloneWithEnfold(form, selection, 0);
};
