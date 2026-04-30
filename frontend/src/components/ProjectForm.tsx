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

  const formatSelectedText = (
    field: keyof ProjectFormData,
    before: string,
    after: string = before
  ) => {
    const textarea = document.getElementById(
      field
    ) as HTMLTextAreaElement | null;

    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = formData[field];

    const selectedText = currentValue.slice(start, end);
    const replacement = selectedText
      ? `${before}${selectedText}${after}`
      : `${before}Text${after}`;

    const updatedValue =
      currentValue.slice(0, start) + replacement + currentValue.slice(end);

    setFormData((prev) => ({
      ...prev,
      [field]: updatedValue,
    }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + (selectedText || "Text").length
      );
    }, 0);
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

        <div className="format-toolbar">
          <button
            type="button"
            onClick={() => formatSelectedText("description", "**")}
          >
            Bold
          </button>

          <button
            type="button"
            onClick={() => formatSelectedText("description", "*")}
          >
            Italic
          </button>

          <button
            type="button"
            onClick={() => formatSelectedText("description", "__")}
          >
            Underline
          </button>

          <button
            type="button"
            onClick={() => formatSelectedText("description", "- ", "")}
          >
            Bullet
          </button>

          <button
            type="button"
            onClick={() => {
              const lines = formData.description.split("\n");

              // Find last numbered item
              let lastNumber = 0;

              for (let i = lines.length - 1; i >= 0; i--) {
                const match = lines[i].trim().match(/^(\d+)\.\s/);
                if (match) {
                  lastNumber = parseInt(match[1], 10);
                  break;
                }
              }

              const nextNumber = lastNumber + 1;

              setFormData((prev) => ({
                ...prev,
                description:
                  prev.description +
                  (prev.description ? "\n" : "") +
                  `${nextNumber}. `,
              }));
            }}
          >
            Numbered
          </button>

          <button
            type="button"
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                description: `${prev.description}${prev.description ? "\n" : ""}---`,
              }))
            }
          >
            Separator
          </button>
        </div>

        <textarea
          id="description"
          rows={7}
          placeholder="Write a short project description"
          value={formData.description}
          onChange={handleChange}
        />

        <small>
          Supports **bold**, *italic*, __underline__, bullet lists, numbered
          lists, and --- separators.
        </small>
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
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const formDataUpload = new FormData();
            formDataUpload.append("file", file);

            try {
              const response = await fetch(
                "http://localhost:8080/api/upload/image",
                {
                  method: "POST",
                  body: formDataUpload,
                }
              );

              const imageUrl = await response.text();

              setFormData((prev) => ({
                ...prev,
                cover: imageUrl,
              }));
            } catch (error) {
              console.error("Upload failed", error);
            }
          }}
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
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={async (e) => {
            const files = e.target.files;
            if (!files) return;

            const uploadedUrls: string[] = [];

            for (const file of Array.from(files)) {
              const formDataUpload = new FormData();
              formDataUpload.append("file", file);

              try {
                const response = await fetch(
                  "http://localhost:8080/api/upload/image",
                  {
                    method: "POST",
                    body: formDataUpload,
                  }
                );

                const url = await response.text();
                uploadedUrls.push(url);
              } catch (error) {
                console.error("Upload failed", error);
              }
            }

            setFormData((prev) => {
              const existing = prev.images
                ? prev.images.split(",").map((i) => i.trim())
                : [];

              const combined = [...existing, ...uploadedUrls];

              return {
                ...prev,
                images: combined.join(", "),
              };
            });
          }}
        />
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
