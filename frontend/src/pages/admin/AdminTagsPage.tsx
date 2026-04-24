import { useMemo, useState } from "react";
import useTags from "../../hooks/useTags";
import useProjects from "../../hooks/useProjects";
import Toast from "../../components/Toast";

function AdminTagsPage() {
  const { tags, addTag, updateTag, deleteTag } = useTags();
  const { projects } = useProjects();

  const [newTag, setNewTag] = useState("");
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editedValue, setEditedValue] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const visibleTags = useMemo(() => {
    const projectTags = projects.flatMap((project) => project.tags ?? []);
    return [...new Set([...tags, ...projectTags])].sort();
  }, [tags, projects]);

  const handleAddTag = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedTag = newTag.trim().toLowerCase();
    if (!trimmedTag) return;

    if (visibleTags.includes(trimmedTag)) {
      setToastMessage("Tag already exists!");
      setShowToast(true);
      return;
    }

    addTag(trimmedTag);
    setToastMessage("Tag added!");
    setShowToast(true);
    setNewTag("");
  };

  const handleStartEdit = (tag: string) => {
    setEditingTag(tag);
    setEditedValue(tag);
  };

  const handleSaveEdit = () => {
    if (!editingTag) return;

    const trimmed = editedValue.trim().toLowerCase();
    if (!trimmed) return;

    updateTag(editingTag, trimmed);
    setToastMessage("Tag updated!");
    setShowToast(true);
    setEditingTag(null);
    setEditedValue("");
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setEditedValue("");
  };

  return (
    <>
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
          {visibleTags.map((tag, index) => (
            <div key={`${tag}-${index}`} className="admin-tag-row">
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
                      onClick={() => {
                        if (!tags.includes(tag)) {
                          setToastMessage(
                            "This tag is from a project. Edit it from the project page."
                          );
                          setShowToast(true);
                          return;
                        }

                        handleStartEdit(tag);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="admin-danger-button"
                      onClick={() => {
                        if (!tags.includes(tag)) {
                          setToastMessage(
                            "This tag is from a project. Remove it by editing the project."
                          );
                          setShowToast(true);
                          return;
                        }

                        deleteTag(tag);
                        setToastMessage("Tag deleted!");
                        setShowToast(true);
                      }}
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

      {showToast && (
        <Toast message={toastMessage} onClose={() => setShowToast(false)} />
      )}
    </>
  );
}

export default AdminTagsPage;
