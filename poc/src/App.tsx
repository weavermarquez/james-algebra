import { useEffect, useMemo, useState } from "react";

import { NetworkView } from "@/dialects/network";
import { demoForm } from "@/dialects/network/demo";
import {
  buildEnfoldingSteps,
  getEnfoldingSequenceNames,
} from "@/lib/james-algebra/enfold-sequences";
import "./index.css";

export function App() {
  const sequenceNames = useMemo(
    () => ["demo", ...getEnfoldingSequenceNames()],
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
            {sequenceNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
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
      <div style={{ width: "100%", height: "calc(100% - 5rem)" }}>
        <NetworkView form={currentForm} />
      </div>
    </div>
  );
}

export default App;
