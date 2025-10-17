import { useMemo } from "react";

import type { FormNode } from "@/lib/james-algebra";

import { buildNetworkGraph } from "./layout";
import { buildPlanarSet } from "./geometry";
import type { NetworkGraph, NetworkNode } from "./types";

const NODE_STROKE = "#333";
const NODE_FILL_ROUND = "#FFE2B3";
const NODE_FILL_SQUARE = "#CDE6FF";
const NODE_FILL_DIAMOND = "#EED5F5";
const NODE_FILL_ATOM = "#F5F5F5";
const EDGE_STROKE = "#555";
const EDGE_WIDTH = 1.5;

const getNodeFill = (node: NetworkNode): string => {
  switch (node.type) {
    case "round":
      return NODE_FILL_ROUND;
    case "square":
      return NODE_FILL_SQUARE;
    case "angle":
      return NODE_FILL_DIAMOND;
    case "atom":
    default:
      return NODE_FILL_ATOM;
  }
};

const expandBounds = (graph: NetworkGraph, padding = 4) => {
  const xs = graph.nodes.map((n) => n.x);
  const ys = graph.nodes.map((n) => n.y);
  const minX = Math.min(...xs, 0) - padding;
  const maxX = Math.max(...xs, 0) + padding;
  const minY = Math.min(...ys, 0) - padding;
  const maxY = Math.max(...ys, 0) + padding;
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

export interface NetworkViewProps {
  form: FormNode;
  className?: string;
}

export function NetworkView({ form, className }: NetworkViewProps) {
  const { graph, planarSet } = useMemo(() => {
    const network = buildNetworkGraph(form);
    const planar = buildPlanarSet(network);
    return { graph: network, planarSet: planar };
  }, [form]);

  const bounds = expandBounds(graph);

  return (
    <div className={className}>
      <svg
        viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width || 10} ${bounds.height || 10}`}
        width="100%"
        height="100%"
        style={{ maxHeight: "100vh" }}
      >
        {graph.edges.map((edge) => {
          const from = graph.nodes.find((n) => n.id === edge.from);
          const to = graph.nodes.find((n) => n.id === edge.to);
          if (!from || !to) return null;
          return (
            <line
              key={edge.id}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={EDGE_STROKE}
              strokeWidth={EDGE_WIDTH}
              strokeLinecap="round"
            />
          );
        })}

        {graph.nodes.map((node) => {
          const fill = getNodeFill(node);
          switch (node.type) {
            case "round":
              return (
                <circle
                  key={node.id}
                  cx={node.x}
                  cy={node.y}
                  r={1}
                  stroke={NODE_STROKE}
                  strokeWidth={0.1}
                  fill={fill}
                />
              );
            case "square":
              return (
                <rect
                  key={node.id}
                  x={node.x - 1}
                  y={node.y - 1}
                  width={2}
                  height={2}
                  stroke={NODE_STROKE}
                  strokeWidth={0.1}
                  fill={fill}
                  rx={0.1}
                  ry={0.1}
                />
              );
            case "angle":
              return (
                <polygon
                  key={node.id}
                  points={`${node.x},${node.y - 0.7} ${node.x + 0.7},${node.y} ${node.x},${node.y + 0.7} ${node.x - 0.7},${node.y}`}
                  stroke={NODE_STROKE}
                  strokeWidth={0.1}
                  fill={fill}
                />
              );
            case "atom":
            default:
              return (
                <circle
                  key={node.id}
                  cx={node.x}
                  cy={node.y}
                  r={0.5}
                  stroke={NODE_STROKE}
                  strokeWidth={0.1}
                  fill={fill}
                />
              );
          }
        })}
      </svg>
    </div>
  );
}
