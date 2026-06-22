import { useEffect, useState } from "react";
import type { GalleryImage, MediaAsset, Project } from "../data/projects";
import { ProjectContext } from "./project-context";
import { API_BASE_URL } from "../config";
import type { JSONContent } from "@tiptap/react";
import {
  ensureProjectContentJson,
  type LegacyProjectContentBlock,
} from "../utils/projectContentMigration";

function normalizeGalleryMode(value: unknown): GalleryImage["mode"] {
  if (
    value === "original" ||
    value === "landscape" ||
    value === "portrait" ||
    value === "square" ||
    value === "header"
  ) {
    return value;
  }

  return value === "header" ? "header" : "landscape";
}

function normalizeProject(project: Project): Project {
  let parsedContentJson: JSONContent | null = null;
  let parsedGalleryImages: GalleryImage[] = [];
  let parsedVideos: MediaAsset[] = [];
  let parsedAudios: MediaAsset[] = [];
  let parsedPdfs: MediaAsset[] = [];

  const parseMediaJson = (
    rawValue: unknown,
    fallback?: MediaAsset
  ): MediaAsset[] => {
    try {
      if (typeof rawValue === "string" && rawValue.trim()) {
        const parsed = JSON.parse(rawValue) as MediaAsset[];

        if (Array.isArray(parsed)) {
          return parsed.filter((item) => item?.url?.trim());
        }
      }
    } catch {
      return fallback?.url ? [fallback] : [];
    }

    return fallback?.url ? [fallback] : [];
  };

  try {
    const rawContentJson: unknown = (project as { contentJson?: unknown }).contentJson;

    if (typeof rawContentJson === "string" && rawContentJson.trim()) {
      parsedContentJson = JSON.parse(rawContentJson) as JSONContent;
    } else if (
      rawContentJson &&
      typeof rawContentJson === "object" &&
      "type" in rawContentJson
    ) {
      parsedContentJson = rawContentJson as JSONContent;
    }
  } catch {
    parsedContentJson = null;
  }

  try {
    const rawGalleryImages = (project as Project & { galleryImagesJson?: string })
      .galleryImagesJson;

    if (typeof rawGalleryImages === "string" && rawGalleryImages.trim()) {
      parsedGalleryImages = JSON.parse(rawGalleryImages) as GalleryImage[];
    }
  } catch {
    parsedGalleryImages = [];
  }

  parsedVideos = parseMediaJson(
    (project as Project & { videosJson?: string }).videosJson,
    project.videoUrl ? { url: project.videoUrl, publicId: project.videoPublicId } : undefined
  );
  parsedAudios = parseMediaJson(
    (project as Project & { audiosJson?: string }).audiosJson,
    project.audioUrl ? { url: project.audioUrl, publicId: project.audioPublicId } : undefined
  );
  parsedPdfs = parseMediaJson(
    (project as Project & { pdfsJson?: string }).pdfsJson,
    project.pdfUrl ? { url: project.pdfUrl, publicId: project.pdfPublicId } : undefined
  );

  if (parsedGalleryImages.length === 0 && Array.isArray(project.images)) {
    parsedGalleryImages = project.images.map((url, index) => ({
      url,
      publicId: project.imagesPublicIds?.[index] ?? undefined,
      mode: "landscape",
    }));
  }

  return {
    ...project,
    contentJson: ensureProjectContentJson(
      parsedContentJson,
      (project as Project & { content?: LegacyProjectContentBlock[] | null }).content ?? null,
      (project as Project & { description?: string | null }).description ?? null,
      (project as Project & { descriptionJson?: JSONContent | null }).descriptionJson ?? null
    ),
    galleryImages: parsedGalleryImages.map((image) => ({
      url: image.url,
      publicId: image.publicId,
      mode: normalizeGalleryMode(image.mode),
    })),
    galleryShowThumbnails: project.galleryShowThumbnails ?? true,
    galleryAutoScroll: project.galleryAutoScroll ?? true,
    videos: parsedVideos,
    audios: parsedAudios,
    pdfs: parsedPdfs,
    coverDisplayMode: project.coverDisplayMode ?? "default",
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
    const galleryImages = project.galleryImages ?? [];

    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        title: project.title,
        category: project.category,
        contentJson: project.contentJson
          ? JSON.stringify(project.contentJson)
          : "",
        cover: project.cover,
        coverPublicId: project.coverPublicId ?? null,
        coverDisplayMode: project.coverDisplayMode ?? "default",
        images: galleryImages.map((image) => image.url),
        imagesPublicIds: galleryImages.map((image) => image.publicId ?? ""),
        galleryImagesJson: JSON.stringify(galleryImages),
        galleryShowThumbnails: project.galleryShowThumbnails ?? true,
        galleryAutoScroll: project.galleryAutoScroll ?? true,
        videosJson: JSON.stringify(project.videos ?? []),
        audiosJson: JSON.stringify(project.audios ?? []),
        pdfsJson: JSON.stringify(project.pdfs ?? []),
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
      throw new Error("Your session has expired. Please log in again.");
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend create project error:", errorText);
      throw new Error(
        errorText.trim() || `Failed to create project (${response.status})`
      );
    }

    const createdProject = normalizeProject(await response.json());
    setProjects((prev) => [...prev, createdProject]);
    return createdProject;
  };

  const updateProject = async (updatedProject: Project) => {
    const galleryImages = updatedProject.galleryImages ?? [];

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
          contentJson: updatedProject.contentJson
            ? JSON.stringify(updatedProject.contentJson)
            : "",
          cover: updatedProject.cover,
          coverPublicId: updatedProject.coverPublicId ?? null,
          coverDisplayMode: updatedProject.coverDisplayMode ?? "default",
          images: galleryImages.map((image) => image.url),
          imagesPublicIds: galleryImages.map((image) => image.publicId ?? ""),
          galleryImagesJson: JSON.stringify(galleryImages),
          galleryShowThumbnails: updatedProject.galleryShowThumbnails ?? true,
          galleryAutoScroll: updatedProject.galleryAutoScroll ?? true,
          videosJson: JSON.stringify(updatedProject.videos ?? []),
          audiosJson: JSON.stringify(updatedProject.audios ?? []),
          pdfsJson: JSON.stringify(updatedProject.pdfs ?? []),
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
      throw new Error("Your session has expired. Please log in again.");
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend update project error:", errorText);
      throw new Error(
        errorText.trim() || `Failed to update project (${response.status})`
      );
    }

    const normalizedProject = normalizeProject(await response.json());

    setProjects((prev) =>
      prev.map((p) => (p.id === normalizedProject.id ? normalizedProject : p))
    );

    return normalizedProject;
  };

  const deleteProject = async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (response.status === 401) {
      handleAuthExpired();
      throw new Error("Your session has expired. Please log in again.");
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend delete project error:", errorText);
      throw new Error(
        errorText.trim() || `Failed to delete project (${response.status})`
      );
    }

    setProjects((prev) => prev.filter((project) => project.id !== id));
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
