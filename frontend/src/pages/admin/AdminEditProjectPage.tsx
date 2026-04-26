import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProjectForm, {
  type ProjectFormData,
} from "../../components/ProjectForm";
import useProjects from "../../hooks/useProjects";
import Toast from "../../components/Toast";

function AdminEditProjectPage() {
  const { id } = useParams();
  const { projects, updateProject } = useProjects();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
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
    tags: (project.tags ?? []).join(", "),
    cover: project.cover ?? "",
    images: (project.images ?? []).join(", "),
    videoUrl: project.videoUrl ?? "",
    audioUrl: project.audioUrl ?? "",
    pdfUrl: project.pdfUrl ?? "",
    codeContent: project.codeContent ?? "",
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
    const images = data.images
      .split(",")
      .map((img) => img.trim())
      .filter(Boolean);
    await updateProject({
      ...project,
      title: data.title,
      category: data.category,
      description: data.description,
      tags: data.tags
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
      cover: data.cover,
      images,
      videoUrl: data.videoUrl,
      audioUrl: data.audioUrl,
      pdfUrl: data.pdfUrl,
      codeContent: data.codeContent,
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
              className="admin-secondary-button admin-reset-button"
              onClick={async () => {
                await updateProject({
                  ...project,
                  likes: 0,
                  views: 0,
                });

                setToastMessage("Stats reset (likes & views)");
                setShowToast(true);
              }}
            >
              Reset Likes & Views
            </button>
          </div>
        </div>

        <ProjectForm
          initialData={initialData}
          submitLabel="Update Project"
          onSubmit={handleSubmit}
        />
      </main>

      {showToast && (
        <Toast message={toastMessage} onClose={() => setShowToast(false)} />
      )}
    </>
  );
}

export default AdminEditProjectPage;
