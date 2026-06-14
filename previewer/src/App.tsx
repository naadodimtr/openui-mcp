import { Renderer } from "@openuidev/react-lang";
import { openuiLibrary } from "./libraries/openui-default";
import { useState, useEffect, useRef } from "react";
import { ErrorBoundary } from "./ErrorBoundary";

function loadStylesheet(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

export default function App() {
  const [spec, setSpec] = useState("");
  const [library, setLibrary] = useState<any>(null);
  const [libraryId, setLibraryId] = useState<string | null>(null);
  const lastModifiedRef = useRef(0);

  useEffect(() => {
    fetch("/api/library-info")
      .then((r) => r.json())
      .then(async (info) => {
        setLibraryId(info.id);
        if (info.id === "openui-default") {
          setLibrary(openuiLibrary);
        } else {
          loadStylesheet(`/libraries/${info.id}/styles.css`);
          try {
            const mod = await import(
              /* @vite-ignore */ `/libraries/${info.id}/renderer.mjs`
            );
            setLibrary(mod.default);
          } catch {
            setLibrary(openuiLibrary);
          }
        }
      })
      .catch(() => {
        setLibraryId("openui-default");
        setLibrary(openuiLibrary);
      });
  }, []);

  useEffect(() => {
    if (!library) return;
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
  }, [library]);

  if (!library) {
    return (
      <div style={{ height: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
        <p style={{ color: "#9ca3af" }}>Loading library...</p>
      </div>
    );
  }

  if (!spec) {
    return (
      <div style={{ height: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
        <div style={{ textAlign: "center", color: "#9ca3af" }}>
          <p style={{ fontSize: "1.125rem", fontWeight: 500 }}>Waiting for spec...</p>
          <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
            Use the <code style={{ background: "#f3f4f6", padding: "0 4px", borderRadius: 4 }}>update_spec</code> MCP tool to render UI here
          </p>
          {libraryId && libraryId !== "openui-default" && (
            <p style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}>
              Library: <strong>{libraryId}</strong>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary spec={spec}>
      <div style={{ height: "100vh", width: "100vw", overflow: "auto", background: "#f9fafb", padding: "2rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Renderer response={spec} library={library} />
        </div>
      </div>
    </ErrorBoundary>
  );
}
