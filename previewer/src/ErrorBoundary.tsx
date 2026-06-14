import { Component, type ReactNode } from "react";

interface Props {
  spec: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.spec !== this.props.spec && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ height: "100vh", width: "100vw", overflow: "auto", background: "#fef2f2", padding: "2rem", fontFamily: "monospace" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <span style={{ fontSize: "1.5rem" }}>⚠</span>
              <h2 style={{ margin: 0, color: "#991b1b", fontSize: "1.25rem" }}>Render Error</h2>
            </div>
            <pre style={{ background: "#fff", border: "1px solid #fca5a5", borderRadius: "8px", padding: "1rem", whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#dc2626", fontSize: "0.875rem" }}>
              {this.state.error.message}
              {this.state.error.stack && `\n\n${this.state.error.stack}`}
            </pre>
            <h3 style={{ color: "#991b1b", fontSize: "1rem", marginTop: "1.5rem" }}>Current Spec</h3>
            <pre style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1rem", whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#374151", fontSize: "0.875rem", lineHeight: 1.6 }}>
              {this.props.spec || "(empty)"}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
