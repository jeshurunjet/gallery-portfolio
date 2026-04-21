import ProjectForm, {
  type ProjectFormData,
} from "../../components/ProjectForm";

function AdminNewProjectPage() {
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
    console.log("New project form data:", data);
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
