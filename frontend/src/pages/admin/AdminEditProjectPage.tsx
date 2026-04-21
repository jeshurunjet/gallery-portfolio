import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { projects } from "../../data/projects";

function AdminEditProjectPage() {
  const { id } = useParams();

  const project = useMemo(
    () => projects.find((item) => item.id === Number(id)),
    [id]
  );

  const [formData, setFormData] = useState(() => ({
    title: project?.title ?? "",
    category: project?.category ?? "",
    description: project?.description ?? "",
    tags: project?.tags.join(", ") ?? "",
    cover: project?.cover ?? "",
    liveUrl: project?.liveUrl ?? "",
    githubUrl: project?.githubUrl ?? "",
    externalUrl: project?.externalUrl ?? "",
  }));

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log("Edited project form data:", formData);
  };

  if (!project) {
    return (
      <main>
        <h1>Project not found</h1>
        <p>The project you are trying to edit does not exist.</p>
      </main>
    );
  }

  return (
    <main>
      <div className="admin-page-header">
        <div>
          <h1>Edit Project</h1>
          <p>Update your project details.</p>
        </div>
      </div>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form-group">
          <label htmlFor="title">Project Title</label>
          <input
            id="title"
            type="text"
            placeholder="Enter project title"
            value={formData.title}
            onChange={handleChange}
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="category">Category</label>
          <input
            id="category"
            type="text"
            placeholder="e.g. UI Design, Audio, Machine Learning"
            value={formData.category}
            onChange={handleChange}
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            rows={5}
            placeholder="Write a short project description"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="tags">Tags</label>
          <input
            id="tags"
            type="text"
            placeholder="e.g. react, ui, portfolio, machine-learning"
            value={formData.tags}
            onChange={handleChange}
          />
          <small>Separate tags with commas.</small>
        </div>

        <div className="admin-form-group">
          <label htmlFor="cover">Cover Image URL</label>
          <input
            id="cover"
            type="text"
            placeholder="https://example.com/image.jpg"
            value={formData.cover}
            onChange={handleChange}
          />
        </div>

        <div className="admin-form-grid">
          <div className="admin-form-group">
            <label htmlFor="liveUrl">Live Demo URL</label>
            <input
              id="liveUrl"
              type="text"
              placeholder="https://your-live-demo.com"
              value={formData.liveUrl}
              onChange={handleChange}
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="githubUrl">GitHub URL</label>
            <input
              id="githubUrl"
              type="text"
              placeholder="https://github.com/yourusername/project"
              value={formData.githubUrl}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="admin-form-group">
          <label htmlFor="externalUrl">External URL</label>
          <input
            id="externalUrl"
            type="text"
            placeholder="https://figma.com/... or another external link"
            value={formData.externalUrl}
            onChange={handleChange}
          />
        </div>

        <div className="admin-form-actions">
          <button type="submit" className="admin-primary-button">
            Update Project
          </button>
        </div>
      </form>
    </main>
  );
}

export default AdminEditProjectPage;
