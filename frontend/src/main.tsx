import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./theme.css";
import App from "./App.tsx";
import ProjectProvider from "./context/ProjectProvider";
import TagProvider from "./context/TagProvider";
import ThemeProvider from "./context/ThemeProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ProjectProvider>
      <TagProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </TagProvider>
    </ProjectProvider>
  </StrictMode>
);
