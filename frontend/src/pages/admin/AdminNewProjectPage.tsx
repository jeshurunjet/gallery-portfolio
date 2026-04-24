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
  const initialData: ProjectFormData = {
    title: "",
    category: "",
    description: "",
    tags: "",
    cover: "",
    liveUrl: "",
    githubUrl: "",
    externalUrl: "",
  };

  const handleSubmit = (data: ProjectFormData) => {
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

    addProject({
      title: data.title,
      category: data.category,
      description: data.description,
      tags: data.tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      cover: data.cover,
      liveUrl: data.liveUrl,
      githubUrl: data.githubUrl,
      externalUrl: data.externalUrl,
      types,
    } as unknown as Project);

    setShowToast(true);

    setTimeout(() => {
      navigate("/admin/projects");
    }, 1500);
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
        />
      </main>

      {showToast && (
        <Toast message="Project created!" onClose={() => setShowToast(false)} />
      )}
    </>
  );
}

export default AdminNewProjectPage;
