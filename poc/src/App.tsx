import { useEffect, useMemo, useState } from "react";

import { NetworkView } from "@/dialects/network";
import { demoForm } from "@/dialects/network/demo";
import {
  buildEnfoldingSteps,
  getEnfoldingSequenceByName,
  getEnfoldingSequenceNames,
} from "@/lib/james-algebra/enfold-sequences";
import "./index.css";

const LEGEND_STROKE = "#333";

type LegendShape = "circle" | "square" | "diamond";

interface LegendItem {
  shape: LegendShape;
  color: string;
  title: string;
  description: string;
}

const LEGEND_ITEMS: LegendItem[] = [
  {
    shape: "circle",
    color: "#FFE2B3",
    title: "Round boundary",
    description: "Unit or quantity",
  },
  {
    shape: "square",
    color: "#CDE6FF",
    title: "Square boundary",
    description: "Grouping / multiplication context",
  },
  {
    shape: "diamond",
    color: "#EED5F5",
    title: "Angle boundary",
    description: "Inversion / cancellation",
  },
];

function LegendIcon({ shape, color }: { shape: LegendShape; color: string }) {
  switch (shape) {
    case "circle":
      return (
        <svg width={20} height={20} style={{ flexShrink: 0 }}>
          <circle cx={10} cy={10} r={8} fill={color} stroke={LEGEND_STROKE} strokeWidth={1.2} />
        </svg>
      );
    case "square":
      return (
        <svg width={20} height={20} style={{ flexShrink: 0 }}>
          <rect
            x={4}
            y={4}
            width={12}
            height={12}
            fill={color}
            stroke={LEGEND_STROKE}
            strokeWidth={1.2}
            rx={2}
            ry={2}
          />
        </svg>
      );
    default:
      return (
        <svg width={20} height={20} style={{ flexShrink: 0 }}>
          <polygon
            points="10,2 18,10 10,18 2,10"
            fill={color}
            stroke={LEGEND_STROKE}
            strokeWidth={1.2}
          />
        </svg>
      );
  }
}

function LegendPanel() {
  return (
    <div
      style={{
        position: "absolute",
        top: "1rem",
        right: "1rem",
        background: "rgba(255, 255, 255, 0.95)",
        borderRadius: "0.75rem",
        boxShadow: "0 12px 28px rgba(15, 23, 42, 0.18)",
        padding: "0.75rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
        maxWidth: "18rem",
      }}
    >
      <span
        style={{
          textTransform: "uppercase",
          fontSize: "0.7rem",
          letterSpacing: "0.08em",
          fontWeight: 600,
          color: "#334155",
        }}
      >
        Legend
      </span>
      {LEGEND_ITEMS.map((item) => (
        <div
          key={item.title}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.82rem",
          }}
        >
          <LegendIcon shape={item.shape} color={item.color} />
          <div>
            <div style={{ fontWeight: 600 }}>{item.title}</div>
            <div style={{ color: "#475569", fontSize: "0.75rem" }}>{item.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function App() {
  const sequenceNames = useMemo(
    () => [...getEnfoldingSequenceNames(), "demo"],
    [],
  );
  const [selectedSequence, setSelectedSequence] = useState<string>(
    sequenceNames[0] ?? "demo",
  );
  const [stepIndex, setStepIndex] = useState(0);

  const { forms, labels } = useMemo(() => {
    if (selectedSequence === "demo") {
      return { forms: [demoForm], labels: ["demo"] };
    }
    return buildEnfoldingSteps(selectedSequence);
  }, [selectedSequence]);

  const selectedSequenceMeta = useMemo(
    () => getEnfoldingSequenceByName(selectedSequence),
    [selectedSequence],
  );

  const showLegend = selectedSequenceMeta?.showLegend ?? false;
  const conventionalLabel = selectedSequenceMeta?.conventional ?? null;

  useEffect(() => {
    setStepIndex(0);
  }, [selectedSequence]);

  const currentForm = forms[stepIndex] ?? forms[0] ?? demoForm;
  const currentLabel = labels[stepIndex] ?? labels[0] ?? "demo";

  const handleNext = () => {
    if (forms.length === 0) return;
    setStepIndex((prev) => (prev + 1) % forms.length);
  };

  const handlePrev = () => {
    if (forms.length === 0) return;
    setStepIndex((prev) => (prev - 1 + forms.length) % forms.length);
  };

  return (
    <div style={{ width: "100vw", height: "100vh", padding: "1rem" }}>
      <div
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Enfolding sequence</span>
          <select
            value={selectedSequence}
            onChange={(event) => setSelectedSequence(event.target.value)}
            style={{ padding: "0.4rem 0.6rem", borderRadius: "0.5rem", minWidth: "12rem" }}
          >
            {sequenceNames.map((name) => {
              const meta = getEnfoldingSequenceByName(name);
              const optionLabel = meta?.title ?? name;
              return (
                <option key={name} value={name}>
                  {optionLabel}
                </option>
              );
            })}
          </select>
        </label>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            type="button"
            onClick={handlePrev}
            style={{ padding: "0.5rem 0.75rem", borderRadius: "999px" }}
          >
            ◀
          </button>
          <span style={{ fontSize: "0.9rem" }}>
            {currentLabel} ({stepIndex + 1}/{forms.length || 1})
          </span>
          <button
            type="button"
            onClick={handleNext}
            style={{ padding: "0.5rem 0.75rem", borderRadius: "999px" }}
          >
            ▶
          </button>
        </div>
      </div>
      {conventionalLabel ? (
        <div style={{ marginBottom: "0.75rem", fontSize: "1rem" }}>
          <span style={{ fontWeight: 600 }}>Conventional:</span>{" "}
          <span>{conventionalLabel}</span>
        </div>
      ) : null}
      <div style={{ width: "100%", height: "calc(100% - 5rem)", position: "relative" }}>
        <NetworkView form={currentForm} />
        {showLegend ? <LegendPanel /> : null}
      </div>
    </div>
  );
}

export default App;
