import { useEffect, useState } from "react";
import type { Project } from "../data/projects";
import { ProjectContext } from "./project-context";
import { API_BASE_URL } from "../config";

function normalizeProject(project: Project): Project {
  let parsedContent = [];

  try {
    if (typeof project.content === "string") {
      parsedContent = JSON.parse(project.content);
    } else if (Array.isArray(project.content)) {
      parsedContent = project.content;
    }
  } catch {
    parsedContent = [];
  }

  return {
    ...project,
    content: parsedContent,
    pinned: project.pinned ?? false,
  };
}

function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const handleAuthExpired = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isAuth");

    sessionStorage.setItem(
      "authMessage",
      "Your session has expired. Please log in again."
    );

    window.location.href = "/admin/login";
  };

  const refreshProjects = async () => {
    try {
      setLoading(true);
      setProgress(15);

      const fakeProgress = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) return prev;
          return prev + 10;
        });
      }, 250);

      const response = await fetch(`${API_BASE_URL}/api/projects`);

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = await response.json();
      const parsedProjects = data.map(normalizeProject);

      clearInterval(fakeProgress);

      setProgress(100);

      setTimeout(() => {
        setProjects(parsedProjects);
        setLoading(false);
      }, 300);
    } catch (error) {
      console.error("Failed to refresh projects:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void refreshProjects();
    });
  }, []);

  const addProject = async (project: Project) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title: project.title,
          category: project.category,
          description: project.description,
          content: project.content ? JSON.stringify(project.content) : "",
          cover: project.cover,
          coverPublicId: (project as any).coverPublicId ?? null,
          images: project.images ?? [],
          imagesPublicIds: (project as any).imagesPublicIds ?? [],
          videoUrl: project.videoUrl ?? "",
          videoPublicId: (project as any).videoPublicId ?? null,
          audioUrl: project.audioUrl ?? "",
          audioPublicId: (project as any).audioPublicId ?? null,
          pdfUrl: project.pdfUrl ?? "",
          pdfPublicId: (project as any).pdfPublicId ?? null,
          codeContent: project.codeContent ?? "",
          liveUrl: project.liveUrl,
          githubUrl: project.githubUrl,
          externalUrl: project.externalUrl,
          tags: project.tags ?? [],
          likes: project.likes ?? 0,
          views: project.views ?? 0,
          pinned: project.pinned ?? false,
          types: project.types ?? [],
        }),
      });

      if (response.status === 401) {
        handleAuthExpired();
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend create project error:", errorText);
        throw new Error(`Failed to create project: ${response.status}`);
      }

      const createdProject = await response.json();
      setProjects((prev) => [...prev, normalizeProject(createdProject)]);
    } catch (error) {
      console.error("Failed to add project:", error);
    }
  };

  const updateProject = async (updatedProject: Project) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${updatedProject.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            title: updatedProject.title,
            category: updatedProject.category,
            description: updatedProject.description,
            content: updatedProject.content
              ? JSON.stringify(updatedProject.content)
              : "",
            cover: updatedProject.cover,
            coverPublicId: (updatedProject as any).coverPublicId ?? null,
            images: updatedProject.images ?? [],
            imagesPublicIds: (updatedProject as any).imagesPublicIds ?? [],
            videoUrl: updatedProject.videoUrl ?? "",
            videoPublicId: (updatedProject as any).videoPublicId ?? null,
            audioUrl: updatedProject.audioUrl ?? "",
            audioPublicId: (updatedProject as any).audioPublicId ?? null,
            pdfUrl: updatedProject.pdfUrl ?? "",
            pdfPublicId: (updatedProject as any).pdfPublicId ?? null,
            codeContent: updatedProject.codeContent ?? "",
            liveUrl: updatedProject.liveUrl,
            githubUrl: updatedProject.githubUrl,
            externalUrl: updatedProject.externalUrl,
            tags: updatedProject.tags ?? [],
            likes: updatedProject.likes ?? 0,
            views: updatedProject.views ?? 0,
            pinned: updatedProject.pinned ?? false,
            types: updatedProject.types ?? [],
          }),
        }
      );

      if (response.status === 401) {
        handleAuthExpired();
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend update project error:", errorText);
        throw new Error(`Failed to update project: ${response.status}`);
      }

      const savedProject = await response.json();
      const normalizedProject = normalizeProject(savedProject);

      setProjects((prev) =>
        prev.map((p) => (p.id === normalizedProject.id ? normalizedProject : p))
      );
    } catch (error) {
      console.error("Failed to update project:", error);
    }
  };

  const deleteProject = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.status === 401) {
        handleAuthExpired();
        return;
      }

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
        loading,
        progress,
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
