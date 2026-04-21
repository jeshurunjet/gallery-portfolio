import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { projects } from "../../data/projects";
import ProjectForm, {
  type ProjectFormData,
} from "../../components/ProjectForm";

function AdminEditProjectPage() {
  const { id } = useParams();

  const project = useMemo(
    () => projects.find((item) => item.id === Number(id)),
    [id]
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
    title: project.title,
    category: project.category,
    description: project.description,
    tags: project.tags.join(", "),
    cover: project.cover,
    liveUrl: project.liveUrl ?? "",
    githubUrl: project.githubUrl ?? "",
    externalUrl: project.externalUrl ?? "",
  };

  const handleSubmit = (data: ProjectFormData) => {
    console.log("Edited project form data:", data);
  };

  return (
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
  );
}

export default AdminEditProjectPage;
