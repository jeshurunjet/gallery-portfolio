import { createContext } from "react";
import type { Project } from "../data/projects";

export type ProjectContextType = {
  projects: Project[];
  refreshProjects: () => Promise<void>;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  deleteProject: (id: number) => void;
};

export const ProjectContext = createContext<ProjectContextType | undefined>(
  undefined
);
