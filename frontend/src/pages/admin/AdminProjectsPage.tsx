import { Link } from "react-router-dom";
import useProjects from "../../hooks/useProjects";
import { useState } from "react";
import ConfirmModal from "../../components/ConfirmModal";
import Toast from "../../components/Toast";
import { ThumbsUp, Eye } from "lucide-react";

function AdminProjectsPage() {
  const { projects, deleteProject } = useProjects();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);

  return (
    <>
      <main>
        <div className="admin-page-header">
          <div>
            <h1>Manage Projects</h1>
            <p>View and manage your portfolio projects.</p>
          </div>

          <Link to="/admin/projects/new" className="admin-primary-button">
            + New Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="admin-empty-state">
            <h2>No projects yet</h2>
            <p>Create a new project to start building your portfolio.</p>
            <Link to="/admin/projects/new" className="admin-primary-button">
              Create Project
            </Link>
          </div>
        ) : (
          <div className="admin-project-list">
            {projects.map((project) => {
              const category = project.category ?? "Uncategorized";
              const tags = project.tags ?? [];

              return (
                <div key={project.id} className="admin-project-card">
                  {project.cover && project.cover.trim() !== "" ? (
                    <img
                      src={project.cover}
                      alt={project.title}
                      className="admin-project-image"
                    />
                  ) : (
                    <div className="admin-project-image admin-project-image-fallback">
                      No image
                    </div>
                  )}

                  <div className="admin-project-info">
                    <h3>{project.title}</h3>
                    <p>{category}</p>

                    <div className="admin-project-meta">
                      <span>
                        <div className="stat-item">
                          <ThumbsUp size={16} /> {project.likes ?? 0}
                        </div>
                      </span>
                      <span>
                        <div className="stat-item">
                          <Eye size={16} /> {project.views ?? 0}
                        </div>
                      </span>
                    </div>

                    <div className="admin-project-tags">
                      {tags.map((tag, index) => (
                        <span key={`${tag}-${index}`} className="admin-tag">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="admin-project-actions">
                    <Link
                      to={`/admin/projects/${project.id}/edit`}
                      className="admin-secondary-button"
                    >
                      Edit
                    </Link>

                    <button
                      type="button"
                      className="admin-danger-button"
                      onClick={() => setSelectedId(project.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selectedId !== null && (
        <ConfirmModal
          message="Are you sure you want to delete this project?"
          onConfirm={() => {
            if (selectedId !== null) {
              deleteProject(selectedId);
              setShowToast(true);
            }
            setSelectedId(null);
          }}
          onCancel={() => setSelectedId(null)}
        />
      )}

      {showToast && (
        <Toast message="Project deleted!" onClose={() => setShowToast(false)} />
      )}
    </>
  );
}

export default AdminProjectsPage;
