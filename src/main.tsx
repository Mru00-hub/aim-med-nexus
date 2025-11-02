import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
console.log('workerSrc (global setup):', pdfjs.GlobalWorkerOptions.workerSrc);
if (import.meta.env.DEV) {
  import('eruda').then(eruda => eruda.default.init());
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
