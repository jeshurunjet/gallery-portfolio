import { Link } from "react-router-dom";
import useProjects from "../../hooks/useProjects";
import { useMemo, useState } from "react";
import ConfirmModal from "../../components/ConfirmModal";
import Toast from "../../components/Toast";
import { AlertCircle, Eye, Pin, Search, ThumbsUp } from "lucide-react";

type ProjectSortOption = "recent" | "views" | "likes" | "az";

function AdminProjectsPage() {
  const { projects, deleteProject } = useProjects();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<ProjectSortOption>("recent");

  const filteredProjects = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const matches = projects.filter((project) => {
      if (!normalizedSearch) return true;

      const searchableText = [
        project.title,
        project.category,
        ...(project.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });

    return [...matches].sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }

      switch (sortBy) {
        case "views":
          return (b.views ?? 0) - (a.views ?? 0);
        case "likes":
          return (b.likes ?? 0) - (a.likes ?? 0);
        case "az":
          return a.title.localeCompare(b.title);
        default:
          return b.id - a.id;
      }
    });
  }, [projects, searchTerm, sortBy]);

  const getProjectWarnings = (project: (typeof projects)[number]) => {
    const warnings: string[] = [];

    if (!project.cover?.trim()) warnings.push("No cover");
    if ((project.tags ?? []).length === 0) warnings.push("No tags");
    if ((project.views ?? 0) === 0) warnings.push("No views");
    if ((project.likes ?? 0) === 0) warnings.push("No likes");

    return warnings;
  };

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

        <section className="admin-project-toolbar">
          <label className="admin-search-field">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search by title, category, or tag"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <div className="admin-sort-tabs" aria-label="Project sort options">
            {[
              ["recent", "Recent"],
              ["views", "Most viewed"],
              ["likes", "Most liked"],
              ["az", "A-Z"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={sortBy === value ? "active" : ""}
                onClick={() => setSortBy(value as ProjectSortOption)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {projects.length === 0 ? (
          <div className="admin-empty-state">
            <h2>No projects yet</h2>
            <p>Create a new project to start building your portfolio.</p>
            <Link to="/admin/projects/new" className="admin-primary-button">
              Create Project
            </Link>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="admin-empty-state">
            <h2>No matching projects</h2>
            <p>Try a different title, category, or tag.</p>
          </div>
        ) : (
          <div className="admin-project-list">
            {filteredProjects.map((project) => {
              const category = project.category ?? "Uncategorized";
              const tags = project.tags ?? [];
              const visibleTags = tags.slice(0, 3);
              const warnings = getProjectWarnings(project);
              const engagement =
                (project.views ?? 0) > 0
                  ? Math.round(((project.likes ?? 0) / (project.views ?? 0)) * 1000) /
                    10
                  : 0;

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
                      {project.pinned && (
                        <span className="admin-performance-chip pinned">
                          <Pin size={15} /> Pinned
                        </span>
                      )}
                      <span className="admin-performance-chip">
                        <ThumbsUp size={16} /> {project.likes ?? 0}
                      </span>
                      <span className="admin-performance-chip">
                        <Eye size={16} /> {project.views ?? 0}
                      </span>
                      <span className="admin-performance-chip">
                        {engagement}% engagement
                      </span>
                    </div>

                    <div className="admin-project-tags">
                      {visibleTags.map((tag, index) => (
                        <span key={`${tag}-${index}`} className="admin-tag">
                          #{tag}
                        </span>
                      ))}
                      {tags.length > 3 && (
                        <span className="admin-tag">+{tags.length - 3} more</span>
                      )}
                    </div>

                    {warnings.length > 0 && (
                      <div className="admin-warning-row">
                        <AlertCircle size={15} />
                        {warnings.map((warning) => (
                          <span key={warning}>{warning}</span>
                        ))}
                      </div>
                    )}
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
          onConfirm={async () => {
            if (selectedId !== null) {
              await deleteProject(selectedId);
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
