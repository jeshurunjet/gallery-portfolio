import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProjectForm, {
  type ProjectFormData,
} from "../../components/ProjectForm";
import useProjects from "../../hooks/useProjects";
import Toast from "../../components/Toast";
import { Eye, Pin, ThumbsUp } from "lucide-react";

function AdminEditProjectPage() {
  const { id } = useParams();
  const { projects, updateProject } = useProjects();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [draftPinned, setDraftPinned] = useState<boolean | null>(null);
  const navigate = useNavigate();

  const project = useMemo(
    () => projects.find((item) => item.id === Number(id)),
    [id, projects]
  );

  if (!project) {
    return (
      <main>
        <h1>Project not found</h1>
        <p>The project you are trying to edit does not exist.</p>
      </main>
    );
  }

  const initialData: ProjectFormData = {
    title: project.title ?? "",
    category: project.category ?? "",
    description: project.description ?? "",
    content: project.content ?? [],
    tags: (project.tags ?? []).join(", "),
    cover: project.cover ?? "",
    coverPublicId: project.coverPublicId ?? "",
    galleryImages: project.galleryImages ?? [],
    galleryShowThumbnails: project.galleryShowThumbnails ?? true,
    galleryAutoScroll: project.galleryAutoScroll ?? true,
    videos: project.videos ?? [],
    audios: project.audios ?? [],
    pdfs: project.pdfs ?? [],
    codeContent: project.codeContent ?? "",
    pinned: draftPinned ?? project.pinned ?? false,
    liveUrl: project.liveUrl ?? "",
    githubUrl: project.githubUrl ?? "",
    externalUrl: project.externalUrl ?? "",
  };

  const handleSubmit = async (data: ProjectFormData) => {
    const typesSet = new Set<string>();

    // IMAGE
    if (data.cover) {
      typesSet.add("image");
    }

    // CODE
    if (data.githubUrl) {
      typesSet.add("code");
    }

    if ((data.videos ?? []).length > 0) typesSet.add("video");
    if ((data.audios ?? []).length > 0) typesSet.add("audio");
    if ((data.pdfs ?? []).length > 0) typesSet.add("pdf");

    // WEB / VIDEO / AUDIO / PDF detection
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
    await updateProject({
      ...project,
      title: data.title,
      category: data.category,
      description: data.description,
      content: data.content,
      tags: data.tags
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
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
    });

    setToastMessage("Project updated!");
    setShowToast(true);

    setTimeout(() => {
      navigate("/admin/projects");
    }, 1000);
  };

  return (
    <>
      <main>
        <div className="admin-page-header">
          <div>
            <h1>Edit Project</h1>
            <p>Update your project details.</p>
          </div>
        </div>

        <div className="admin-back-button-container">
          <div className="admin-edit-actions">
            <button
              type="button"
              className="admin-secondary-button admin-back-button"
              onClick={() => navigate("/admin/projects")}
            >
              ← Back
            </button>

            <button
              type="button"
              className={`admin-secondary-button admin-pin-action ${
                (draftPinned ?? project.pinned) ? "active" : ""
              }`}
              onClick={async () => {
                const nextPinned = !(draftPinned ?? project.pinned ?? false);
                setDraftPinned(nextPinned);

                await updateProject({
                  ...project,
                  pinned: nextPinned,
                });

                setToastMessage(
                  nextPinned
                    ? "Project pinned to homepage"
                    : "Project unpinned from homepage"
                );
                setShowToast(true);
              }}
            >
              <Pin size={17} />
              {(draftPinned ?? project.pinned)
                ? "Unpin Project"
                : "Pin Project"}
            </button>

            <button
              type="button"
              className="admin-secondary-button admin-reset-button"
              onClick={async () => {
                await updateProject({
                  ...project,
                  likes: 0,
                  pinned: draftPinned ?? project.pinned ?? false,
                });

                setToastMessage("Likes reset");
                setShowToast(true);
              }}
            >
              <ThumbsUp size={17} />
              Reset Likes
            </button>

            <button
              type="button"
              className="admin-secondary-button admin-reset-button"
              onClick={async () => {
                await updateProject({
                  ...project,
                  views: 0,
                  pinned: draftPinned ?? project.pinned ?? false,
                });

                setToastMessage("Views reset");
                setShowToast(true);
              }}
            >
              <Eye size={17} />
              Reset Views
            </button>
          </div>
        </div>

        <ProjectForm
          initialData={initialData}
          submitLabel="Update Project"
          onSubmit={handleSubmit}
          pinnedOverride={draftPinned ?? project.pinned ?? false}
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

export default AdminEditProjectPage;
