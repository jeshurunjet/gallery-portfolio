import { createContext } from "react";
import type { Project } from "../data/projects";

export type ProjectContextType = {
  projects: Project[];
  loading: boolean;
  progress: number;
  refreshProjects: () => Promise<void>;
  addProject: (project: Project) => Promise<Project>;
  updateProject: (project: Project) => Promise<Project>;
  deleteProject: (id: number) => Promise<void>;
};

export const ProjectContext = createContext<ProjectContextType | undefined>(
  undefined
);
