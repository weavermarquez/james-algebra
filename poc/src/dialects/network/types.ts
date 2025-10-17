import type { FormNode, FormId } from "@/lib/james-algebra";

export type NetworkNodeType = "round" | "square" | "angle" | "atom";

export type NetworkNode = {
  id: FormId;
  type: NetworkNodeType;
  label: string;
  depth: number;
  x: number;
  y: number;
};

export type NetworkEdge = {
  id: string;
  from: FormId;
  to: FormId;
};

export type NetworkGraph = {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
};

export type FormWithIds = FormNode;
