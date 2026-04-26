import { useEffect, useState } from "react";
import type { Project } from "../data/projects";
import { ProjectContext } from "./project-context";

function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);

  const refreshProjects = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/projects");

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error("Failed to refresh projects:", error);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void refreshProjects();
    });
  }, []);

  const addProject = async (project: Project) => {
    try {
      const response = await fetch("http://localhost:8080/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: project.title,
          category: project.category,
          description: project.description,
          cover: project.cover,
          images: project.images ?? [],
          videoUrl: project.videoUrl ?? "",
          audioUrl: project.audioUrl ?? "",
          pdfUrl: project.pdfUrl ?? "",
          codeContent: project.codeContent ?? "",
          liveUrl: project.liveUrl,
          githubUrl: project.githubUrl,
          externalUrl: project.externalUrl,
          tags: project.tags ?? [],
          likes: project.likes ?? 0,
          views: project.views ?? 0,
          types: project.types ?? [],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend create project error:", errorText);
        throw new Error(`Failed to create project: ${response.status}`);
      }

      const createdProject = await response.json();
      setProjects((prev) => [...prev, createdProject]);
    } catch (error) {
      console.error("Failed to add project:", error);
    }
  };

  const updateProject = async (updatedProject: Project) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/projects/${updatedProject.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: updatedProject.title,
            category: updatedProject.category,
            description: updatedProject.description,
            cover: updatedProject.cover,
            images: updatedProject.images ?? [],
            videoUrl: updatedProject.videoUrl ?? "",
            audioUrl: updatedProject.audioUrl ?? "",
            pdfUrl: updatedProject.pdfUrl ?? "",
            codeContent: updatedProject.codeContent ?? "",
            liveUrl: updatedProject.liveUrl,
            githubUrl: updatedProject.githubUrl,
            externalUrl: updatedProject.externalUrl,
            tags: updatedProject.tags ?? [],
            likes: updatedProject.likes ?? 0,
            views: updatedProject.views ?? 0,
            types: updatedProject.types ?? [],
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend update project error:", errorText);
        throw new Error(`Failed to update project: ${response.status}`);
      }

      const savedProject = await response.json();

      setProjects((prev) =>
        prev.map((p) => (p.id === savedProject.id ? savedProject : p))
      );
    } catch (error) {
      console.error("Failed to update project:", error);
    }
  };

  const deleteProject = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/projects/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        refreshProjects,
        addProject,
        updateProject,
        deleteProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export default ProjectProvider;
