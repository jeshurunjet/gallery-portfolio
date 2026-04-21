import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import ProjectProvider from "./context/ProjectProvider";
import TagProvider from "./context/TagProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ProjectProvider>
      <TagProvider>
        <App />
      </TagProvider>
    </ProjectProvider>
  </StrictMode>
);
