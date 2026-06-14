import React from "react";
import ReactDOM from "react-dom";
import * as jsxRuntime from "react/jsx-runtime";
import { createRoot } from "react-dom/client";
import App from "./App";

(window as any).__OPENUI_REACT = React;
(window as any).__OPENUI_REACT_DOM = ReactDOM;
(window as any).__OPENUI_JSX_RUNTIME = jsxRuntime;

createRoot(document.getElementById("root")!).render(<App />);
