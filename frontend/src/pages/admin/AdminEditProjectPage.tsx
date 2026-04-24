import { useMemo } from "react";
import { useParams } from "react-router-dom";
import ProjectForm, {
  type ProjectFormData,
} from "../../components/ProjectForm";
import useProjects from "../../hooks/useProjects";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../../components/Toast";

function AdminEditProjectPage() {
  const { id } = useParams();
  const { projects, updateProject } = useProjects();
  const [showToast, setShowToast] = useState(false);
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
    liveUrl: project.liveUrl ?? "",
    githubUrl: project.githubUrl ?? "",
    externalUrl: project.externalUrl ?? "",
  };

  const handleSubmit = (data: ProjectFormData) => {
    updateProject({
      ...project,
      title: data.title,
      category: data.category,
      description: data.description,
      tags: data.tags
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
      cover: data.cover,
      liveUrl: data.liveUrl,
      githubUrl: data.githubUrl,
      externalUrl: data.externalUrl,
    });

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

        <ProjectForm
          initialData={initialData}
          submitLabel="Update Project"
          onSubmit={handleSubmit}
        />
      </main>

      {showToast && (
        <Toast message="Project updated!" onClose={() => setShowToast(false)} />
      )}
    </>
  );
}

export default AdminEditProjectPage;
