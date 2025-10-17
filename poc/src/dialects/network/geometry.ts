import Flatten from "@flatten-js/core";

import type { NetworkGraph, NetworkNode, NetworkEdge } from "./types";
import { NODE_BASE_SIZE, DIAMOND_SIZE } from "./layout";

const { circle, polygon, point, segment, PlanarSet } = Flatten;

export type NetworkPlanarSet = {
  planarSet: typeof PlanarSet.prototype;
};

const createCircle = (x: number, y: number, radius: number) => circle(point(x, y), radius);

const createSquare = (x: number, y: number, side: number) => {
  const half = side / 2;
  return polygon([
    point(x - half, y - half),
    point(x + half, y - half),
    point(x + half, y + half),
    point(x - half, y + half),
  ]);
};

const createDiamond = (x: number, y: number, side: number) => {
  const half = side / Math.sqrt(2);
  return polygon([
    point(x, y - half),
    point(x + half, y),
    point(x, y + half),
    point(x - half, y),
  ]);
};

const addNodeShape = (set: typeof PlanarSet.prototype, node: NetworkNode) => {
  switch (node.type) {
    case "round":
      set.add(createCircle(node.x, node.y, NODE_BASE_SIZE));
      break;
    case "square":
      set.add(createSquare(node.x, node.y, NODE_BASE_SIZE * 2));
      break;
    case "angle":
      set.add(createDiamond(node.x, node.y, DIAMOND_SIZE * 2));
      break;
    case "atom":
    default:
      set.add(createCircle(node.x, node.y, NODE_BASE_SIZE * 0.5));
      break;
  }
};

const addEdgeShape = (
  set: typeof PlanarSet.prototype,
  nodesById: Map<string, NetworkNode>,
  edge: NetworkEdge,
) => {
  const from = nodesById.get(edge.from);
  const to = nodesById.get(edge.to);
  if (!from || !to) return;
  set.add(segment(point(from.x, from.y), point(to.x, to.y)));
};

export const buildPlanarSet = (graph: NetworkGraph) => {
  const set = new PlanarSet();
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n] as const));

  graph.nodes.forEach((node) => addNodeShape(set, node));
  graph.edges.forEach((edge) => addEdgeShape(set, nodeMap, edge));

  return set;
};
