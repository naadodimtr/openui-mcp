import React from "react";
import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";
import App from "./App";

(window as any).__OPENUI_REACT = React;
(window as any).__OPENUI_REACT_DOM = ReactDOM;

createRoot(document.getElementById("root")!).render(<App />);
