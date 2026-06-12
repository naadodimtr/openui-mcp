"use client";
import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";

import { Renderer } from "@openuidev/react-lang";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [spec, setSpec] = useState("");
  const [error, setError] = useState<string | null>(null);
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
            setError(null);
          }
        } catch {
          setError("Failed to fetch spec");
        }

        await new Promise((r) => setTimeout(r, 500));
      }
    }

    poll();
    return () => {
      active = false;
    };
  }, []);

  if (!spec) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400">
          <p className="text-lg font-medium">Waiting for spec...</p>
          <p className="text-sm mt-2">
            Use the <code className="bg-gray-100 px-1 rounded">update_spec</code> MCP tool to render UI here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-auto bg-white p-4">
      {error && (
        <div className="fixed top-2 right-2 bg-red-100 text-red-700 px-3 py-1 rounded text-sm">
          {error}
        </div>
      )}
      <Renderer response={spec} library={openuiLibrary} />
    </div>
  );
}
