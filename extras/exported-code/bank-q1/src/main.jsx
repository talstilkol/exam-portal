// src/main.jsx
// קובץ הכניסה הראשי של React.
// תפקידו להכניס את App לתוך div#root שנמצא ב-index.html.
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
