import { useMemo, useState } from "react";
import { projects } from "../../data/projects";

function AdminTagsPage() {
  const initialTags = useMemo(() => {
    const allTags = projects.flatMap((project) => project.tags);
    return [...new Set(allTags)].sort();
  }, []);

  const [newTag, setNewTag] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log("New tag:", newTag);
    setNewTag("");
  };

  return (
    <main>
      <div className="admin-page-header">
        <div>
          <h1>Manage Tags</h1>
          <p>Create and organize project tags.</p>
        </div>
      </div>

      <form className="admin-inline-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter a new tag"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
        />
        <button type="submit" className="admin-primary-button">
          Add Tag
        </button>
      </form>

      <div className="admin-tag-list">
        {initialTags.map((tag) => (
          <div key={tag} className="admin-tag-row">
            <span className="admin-tag-name">#{tag}</span>

            <div className="admin-tag-actions">
              <button type="button" className="admin-secondary-button">
                Edit
              </button>
              <button type="button" className="admin-danger-button">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export default AdminTagsPage;
