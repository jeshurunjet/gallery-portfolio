import { Link } from "react-router-dom";
import { useState } from "react";
import { projects as initialProjects } from "../../data/projects";
import type { Project } from "../../data/projects";

function AdminProjectsPage() {
  const [projectList, setProjectList] = useState<Project[]>(initialProjects);

  const handleDeleteProject = (projectId: number) => {
    setProjectList((prev) =>
      prev.filter((project) => project.id !== projectId)
    );
  };

  return (
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

      {projectList.length === 0 ? (
        <div className="admin-empty-state">
          <h2>No projects yet</h2>
          <p>Create a new project to start building your portfolio.</p>
          <Link to="/admin/projects/new" className="admin-primary-button">
            Create Project
          </Link>
        </div>
      ) : (
        <div className="admin-project-list">
          {projectList.map((project) => (
            <div key={project.id} className="admin-project-card">
              <img
                src={project.cover}
                alt={project.title}
                className="admin-project-image"
              />

              <div className="admin-project-info">
                <h3>{project.title}</h3>
                <p>{project.category}</p>

                <div className="admin-project-meta">
                  <span>❤️ {project.likes}</span>
                  <span>👁️ {project.views}</span>
                </div>

                <div className="admin-project-tags">
                  {project.tags.map((tag) => (
                    <span key={tag} className="admin-tag">
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
                  onClick={() => handleDeleteProject(project.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default AdminProjectsPage;
