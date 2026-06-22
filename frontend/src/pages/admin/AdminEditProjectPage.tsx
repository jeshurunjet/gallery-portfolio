import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProjectForm, {
  type ProjectFormData,
} from "../../components/ProjectForm";
import useProjects from "../../hooks/useProjects";
import Toast from "../../components/Toast";
import { Eye, SquarePen, ThumbsUp } from "lucide-react";

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
    content: [],
    contentJson: project.contentJson ?? null,
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
    try {
      await updateProject({
        ...project,
        title: data.title,
        category: data.category,
        contentJson: data.contentJson,
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
    } catch (error) {
      setToastMessage(
        error instanceof Error ? error.message : "Failed to update project."
      );
      setShowToast(true);
    }
  };

  return (
    <>
      <main>
        <div className="admin-page-header">
          <div className="admin-page-heading">
            <span className="admin-page-heading-icon" aria-hidden="true">
              <SquarePen size={20} />
            </span>

            <div className="admin-page-heading-copy">
              <h1>Edit Project</h1>
              <p>Update your project details.</p>
            </div>
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
          </div>
        </div>

        <ProjectForm
          initialData={initialData}
          submitLabel="Update Project"
          onSubmit={handleSubmit}
          pinnedOverride={draftPinned ?? project.pinned ?? false}
          onPinnedChange={setDraftPinned}
          headerActions={
            <>
              <button
                type="button"
                className="admin-pin-button admin-pin-action admin-pin-action-icon"
                aria-label="Reset likes"
                data-label="Reset likes"
                title="Reset likes"
                onClick={async () => {
                  try {
                    await updateProject({
                      ...project,
                      likes: 0,
                      pinned: draftPinned ?? project.pinned ?? false,
                    });

                    setToastMessage("Likes reset");
                    setShowToast(true);
                  } catch (error) {
                    setToastMessage(
                      error instanceof Error ? error.message : "Failed to reset likes."
                    );
                    setShowToast(true);
                  }
                }}
              >
                <ThumbsUp size={18} />
              </button>

              <button
                type="button"
                className="admin-pin-button admin-pin-action admin-pin-action-icon"
                aria-label="Reset views"
                data-label="Reset views"
                title="Reset views"
                onClick={async () => {
                  try {
                    await updateProject({
                      ...project,
                      views: 0,
                      pinned: draftPinned ?? project.pinned ?? false,
                    });

                    setToastMessage("Views reset");
                    setShowToast(true);
                  } catch (error) {
                    setToastMessage(
                      error instanceof Error ? error.message : "Failed to reset views."
                    );
                    setShowToast(true);
                  }
                }}
              >
                <Eye size={18} />
              </button>
            </>
          }
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
