import { useState } from "react";
import useTags from "../../hooks/useTags";

function AdminTagsPage() {
  const { tags, addTag, updateTag, deleteTag } = useTags();
  const [newTag, setNewTag] = useState("");
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editedValue, setEditedValue] = useState("");

  const handleAddTag = (event: React.FormEvent) => {
    event.preventDefault();
    addTag(newTag);
    setNewTag("");
  };

  const handleStartEdit = (tag: string) => {
    setEditingTag(tag);
    setEditedValue(tag);
  };

  const handleSaveEdit = () => {
    if (!editingTag) return;

    updateTag(editingTag, editedValue);
    setEditingTag(null);
    setEditedValue("");
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setEditedValue("");
  };

  return (
    <main>
      <div className="admin-page-header">
        <div>
          <h1>Manage Tags</h1>
          <p>Create and organize project tags.</p>
        </div>
      </div>

      <form className="admin-inline-form" onSubmit={handleAddTag}>
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
        {tags.map((tag) => (
          <div key={tag} className="admin-tag-row">
            {editingTag === tag ? (
              <>
                <input
                  type="text"
                  value={editedValue}
                  onChange={(e) => setEditedValue(e.target.value)}
                  className="admin-tag-edit-input"
                />

                <div className="admin-tag-actions">
                  <button
                    type="button"
                    className="admin-primary-button"
                    onClick={handleSaveEdit}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="admin-tag-name">#{tag}</span>

                <div className="admin-tag-actions">
                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={() => handleStartEdit(tag)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="admin-danger-button"
                    onClick={() => deleteTag(tag)}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}

export default AdminTagsPage;
