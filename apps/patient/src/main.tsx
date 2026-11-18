import { createRoot } from "react-dom/client";
import { PatientApp } from "./PatientApp";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./style.css";
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <PatientApp />
  </ErrorBoundary>,
);
