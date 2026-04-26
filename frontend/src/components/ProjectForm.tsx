import { useState } from "react";

type ProjectFormData = {
  title: string;
  category: string;
  description: string;
  tags: string;
  cover: string;
  images: string;
  videoUrl: string;
  audioUrl: string;
  pdfUrl: string;
  codeContent: string;
  liveUrl: string;
  githubUrl: string;
  externalUrl: string;
};

type ProjectFormProps = {
  initialData: ProjectFormData;
  submitLabel: string;
  onSubmit: (data: ProjectFormData) => void;
};

function ProjectForm({ initialData, submitLabel, onSubmit }: ProjectFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>(initialData);

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { id, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(formData);
  };

  return (
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
        <select id="category" value={formData.category} onChange={handleChange}>
          <option value="">Select a category</option>
          <option value="Photography">Photography</option>
          <option value="Graphic Design">Graphic Design</option>
          <option value="Audio Design">Audio Design</option>
          <option value="Frontend/Web Design">Frontend/Web Design</option>
          <option value="Mobile Design">Mobile Design</option>
          <option value="Machine Learning">Machine Learning</option>
          <option value="Deep Learning">Deep Learning</option>
          <option value="Code Project">Code Project</option>
          <option value="Technical Case Study">Technical Case Study</option>
        </select>
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
      <div className="admin-form-group">
        <label htmlFor="images">Image Gallery URLs</label>
        <textarea
          id="images"
          rows={3}
          placeholder="Paste image URLs separated by commas"
          value={formData.images}
          onChange={handleChange}
        />
        <small>Separate multiple image URLs with commas.</small>
      </div>

      <div className="admin-form-group">
        <label htmlFor="videoUrl">Video URL</label>
        <input
          id="videoUrl"
          type="text"
          placeholder="YouTube, Vimeo, or video link"
          value={formData.videoUrl}
          onChange={handleChange}
        />
      </div>

      <div className="admin-form-group">
        <label htmlFor="audioUrl">Audio URL</label>
        <input
          id="audioUrl"
          type="text"
          placeholder="SoundCloud or audio link"
          value={formData.audioUrl}
          onChange={handleChange}
        />
      </div>

      <div className="admin-form-group">
        <label htmlFor="pdfUrl">PDF URL</label>
        <input
          id="pdfUrl"
          type="text"
          placeholder="/pdfs/sample-report.pdf or https://example.com/file.pdf"
          value={formData.pdfUrl}
          onChange={handleChange}
        />
      </div>

      <div className="admin-form-group">
        <label htmlFor="codeContent">Code Content</label>
        <textarea
          id="codeContent"
          rows={6}
          placeholder="Paste code here if this project has a code preview"
          value={formData.codeContent}
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
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export type { ProjectFormData };
export default ProjectForm;
