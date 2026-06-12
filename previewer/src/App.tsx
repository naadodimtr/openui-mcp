import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";

import { Renderer } from "@openuidev/react-lang";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { useState, useEffect, useRef } from "react";

export default function App() {
  const [spec, setSpec] = useState("");
  const lastModifiedRef = useRef(0);

  useEffect(() => {
    let active = true;

    async function poll() {
      while (active) {
        try {
          const res = await fetch("/api/spec");
          const data = await res.json();
          if (data.lastModified > lastModifiedRef.current) {
            lastModifiedRef.current = data.lastModified;
            setSpec(data.spec);
          }
        } catch {}
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    poll();
    return () => { active = false; };
  }, []);

  if (!spec) {
    return (
      <div style={{ height: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
        <div style={{ textAlign: "center", color: "#9ca3af" }}>
          <p style={{ fontSize: "1.125rem", fontWeight: 500 }}>Waiting for spec...</p>
          <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
            Use the <code style={{ background: "#f3f4f6", padding: "0 4px", borderRadius: 4 }}>update_spec</code> MCP tool to render UI here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", width: "100vw", overflow: "auto", background: "#fff", padding: "1rem" }}>
      <Renderer response={spec} library={openuiLibrary} />
    </div>
  );
}
