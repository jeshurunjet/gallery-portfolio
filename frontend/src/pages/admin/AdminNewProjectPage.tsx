import ProjectForm, {
  type ProjectFormData,
} from "../../components/ProjectForm";
import useProjects from "../../hooks/useProjects";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Toast from "../../components/Toast";
import type { Project } from "../../data/projects";

function AdminNewProjectPage() {
  const { addProject } = useProjects();
  const navigate = useNavigate();

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [draftPinned, setDraftPinned] = useState(false);

  const initialData: ProjectFormData = {
    title: "",
    category: "",
    description: "",
    content: [],
    tags: "",
    cover: "",
    coverPublicId: "",
    galleryImages: [],
    galleryShowThumbnails: true,
    galleryAutoScroll: true,
    videos: [],
    audios: [],
    pdfs: [],
    codeContent: "",
    pinned: draftPinned,
    liveUrl: "",
    githubUrl: "",
    externalUrl: "",
  };

  const handleSubmit = async (data: ProjectFormData) => {
    const typesSet = new Set<string>();

    if (data.cover) typesSet.add("image");
    if (data.githubUrl) typesSet.add("code");
    if ((data.videos ?? []).length > 0) typesSet.add("video");
    if ((data.audios ?? []).length > 0) typesSet.add("audio");
    if ((data.pdfs ?? []).length > 0) typesSet.add("pdf");

    const urlFields = [data.liveUrl, data.externalUrl];

    urlFields.forEach((url) => {
      if (!url) return;

      const lower = url.toLowerCase();

      if (lower.includes("youtube") || lower.includes("youtu.be")) {
        typesSet.add("video");
      } else if (lower.includes("soundcloud")) {
        typesSet.add("audio");
      } else if (lower.endsWith(".pdf")) {
        typesSet.add("pdf");
      } else {
        typesSet.add("web");
      }
    });

    const types = Array.from(typesSet);

    try {
      await addProject({
        title: data.title,
        category: data.category,
        description: data.description,
        content: data.content,
        tags: data.tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        cover: data.cover,
        coverPublicId: data.coverPublicId,
        galleryImages: data.galleryImages,
        galleryShowThumbnails: data.galleryShowThumbnails,
        galleryAutoScroll: data.galleryAutoScroll,
        images: data.galleryImages.map((image) => image.url),
        imagesPublicIds: data.galleryImages.map((image) => image.publicId ?? ""),
        videos: data.videos,
        audios: data.audios,
        pdfs: data.pdfs,
        codeContent: data.codeContent,
        pinned: data.pinned,
        liveUrl: data.liveUrl,
        githubUrl: data.githubUrl,
        externalUrl: data.externalUrl,
        types,
      } as Project);

      setToastMessage("Project created!");
      setShowToast(true);

      setTimeout(() => {
        navigate("/admin/projects");
      }, 1500);
    } catch (error) {
      setToastMessage(
        error instanceof Error ? error.message : "Failed to create project."
      );
      setShowToast(true);
    }
  };

  return (
    <>
      <main>
        <div className="admin-page-header">
          <div>
            <h1>New Project</h1>
            <p>Create a new portfolio project.</p>
          </div>
        </div>

        <ProjectForm
          initialData={initialData}
          submitLabel="Save Project"
          onSubmit={handleSubmit}
          pinnedOverride={draftPinned}
          onPinnedChange={setDraftPinned}
          onNotify={(message) => {
            setToastMessage(message);
            setShowToast(true);
          }}
        />
      </main>

      {showToast && (
        <Toast message={toastMessage} onClose={() => setShowToast(false)} />
      )}
    </>
  );
}

export default AdminNewProjectPage;
