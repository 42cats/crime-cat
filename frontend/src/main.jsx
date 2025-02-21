import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";
// Get the root element
const container = document.getElementById("root");

// Create a root
const root = createRoot(container);

// Render your app
root.render(<App />);
