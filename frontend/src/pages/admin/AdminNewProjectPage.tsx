import ProjectForm, {
  type ProjectFormData,
} from "../../components/ProjectForm";
import useProjects from "../../hooks/useProjects";

function AdminNewProjectPage() {
  const { addProject } = useProjects();

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
    const newProject = {
      id: Date.now(),
      title: data.title,
      category: data.category,
      description: data.description,
      tags: data.tags.split(",").map((t) => t.trim()),
      cover: data.cover,
      likes: 0,
      views: 0,
      types: [],
      images: [],
      liveUrl: data.liveUrl,
      githubUrl: data.githubUrl,
      externalUrl: data.externalUrl,
    };

    addProject(newProject);
  };

  return (
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
  );
}

export default AdminNewProjectPage;
