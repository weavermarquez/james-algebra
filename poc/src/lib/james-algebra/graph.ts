import { TreeNode } from "tree-term-rewriting/src/tree";

import {
  FormNode,
  cloneTreeWithFreshIndices,
  prepareTreeForDisplay,
} from "./types";

const escapeDotString = (value: string): string =>
  value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

export type GraphTreeEntry = {
  name: string;
  tree: TreeNode;
  startIndex?: number;
};

export const buildGraphLink = (
  title: string,
  trees: GraphTreeEntry[],
): string => {
  const graphIdBase = title.replace(/[^A-Za-z0-9_]/g, "");
  const graphId = graphIdBase.length > 0 ? graphIdBase : "Graph";
  const escapedTitle = escapeDotString(title);
  const lines: string[] = [];
  lines.push(`digraph ${graphId} {`);
  lines.push(`  label="${escapedTitle}";`);

  trees.forEach((entry) => {
    const rawName = entry.name.length > 0 ? entry.name : "(unnamed)";
    const escapedName = escapeDotString(rawName);
    const clusterIdRaw = `cluster_${rawName}`;
    const escapedClusterId = escapeDotString(clusterIdRaw);
    const baseIndex = entry.startIndex ?? 1;
    const prepared = prepareTreeForDisplay(entry.tree, baseIndex);
    lines.push(`  subgraph "${escapedClusterId}" {`);
    lines.push(`    style=filled;`);
    lines.push(`    label="${escapedName}";`);

    const visit = (node: TreeNode): void => {
      const escapedValue = escapeDotString(node.value);
      lines.push(`    ${node.index} [label="${escapedValue}"];`);
      node.children.forEach((child) => {
        lines.push(`    ${node.index} -> ${child.index};`);
        visit(child);
      });
    };

    visit(prepared);
    lines.push("  }");
  });

  lines.push("}");

  const dotText = lines.join("\n");
  return `https://dreampuf.github.io/GraphvizOnline/#${encodeURIComponent(dotText)}`;
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
  startIndexOffset = 0,
): GraphTreeEntry[] =>
  forms.map(({ name, form }, index) => ({
    name,
    tree: cloneTreeWithFreshIndices(form),
    startIndex: startIndexOffset + index * 100 + 1,
  }));
