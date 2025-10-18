import { useMemo } from "react";

import type { FormNode } from "@/lib/james-algebra";

import { buildNetworkGraph } from "./layout";
import type { NetworkGraph, NetworkNode } from "./types";

const NODE_STROKE = "#333";
const NODE_FILL_ROOT = "#E0E7FF";
const NODE_FILL_ROUND = "#FFE2B3";
const NODE_FILL_SQUARE = "#CDE6FF";
const NODE_FILL_DIAMOND = "#EED5F5";
const NODE_FILL_ATOM = "#F5F5F5";
const EDGE_STROKE = "#555";
const EDGE_WIDTH = 1.5;
const EDGE_OPACITY = 0.6;

const greekMap: Record<string, string> = {
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  epsilon: "ε",
  zeta: "ζ",
  eta: "η",
  theta: "θ",
  iota: "ι",
  kappa: "κ",
  lambda: "λ",
  mu: "μ",
  nu: "ν",
  xi: "ξ",
  omicron: "ο",
  pi: "π",
  rho: "ρ",
  sigma: "σ",
  tau: "τ",
  upsilon: "υ",
  phi: "φ",
  chi: "χ",
  psi: "ψ",
  omega: "ω",
};

const getNodeFill = (node: NetworkNode): string => {
  switch (node.type) {
    case "root":
      return NODE_FILL_ROOT;
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

const formatNodeLabel = (node: NetworkNode): string | undefined => {
  if (node.type === "atom" && node.label.startsWith("atom:")) {
    const raw = node.label.split(":")[1] ?? "";
    return greekMap[raw.toLowerCase()] ?? raw.charAt(0).toUpperCase() + raw.slice(1);
  }
  if (node.type === "root") {
    return "root";
  }
  return undefined;
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
  const graph = useMemo(() => buildNetworkGraph(form), [form]);
  const bounds = expandBounds(graph);
  const nodeMap = useMemo(
    () => new Map(graph.nodes.map((node) => [node.id, node] as const)),
    [graph],
  );

  return (
    <div className={className}>
      <svg
        viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width || 10} ${bounds.height || 10}`}
        width="100%"
        height="100%"
        style={{ maxHeight: "100vh" }}
      >
        {graph.edges.map((edge) => {
          const from = nodeMap.get(edge.from);
          const to = nodeMap.get(edge.to);
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
              strokeOpacity={EDGE_OPACITY}
            />
          );
        })}

        {graph.nodes.map((node) => {
          const fill = getNodeFill(node);
          const label = formatNodeLabel(node);
          switch (node.type) {
            case "root":
              return (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={1.2}
                    stroke={NODE_STROKE}
                    strokeWidth={0.12}
                    fill={fill}
                  />
                  <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={0.85}
                    fill={NODE_STROKE}
                    fontFamily="Noto Serif Display, serif"
                  >
                    root
                  </text>
                </g>
              );
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
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={0.5}
                    stroke={NODE_STROKE}
                    strokeWidth={0.08}
                    fill={fill}
                  />
                  {label ? (
                    <text
                      x={node.x}
                      y={node.y + 0.02}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={0.7}
                      fill={NODE_STROKE}
                      fontFamily="Noto Serif Display, serif"
                    >
                      {label}
                    </text>
                  ) : null}
                </g>
              );
          }
        })}
      </svg>
    </div>
  );
}
