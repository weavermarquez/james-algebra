import { demoForm } from "@/dialects/network/demo";
import { NetworkView } from "@/dialects/network";
import "./index.css";

export function App() {
  return (
    <div style={{ width: "100vw", height: "100vh", padding: "1rem" }}>
      <NetworkView form={demoForm} />
    </div>
  );
}

export default App;
