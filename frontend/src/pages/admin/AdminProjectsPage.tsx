import { projects } from "../../data/projects";

function AdminProjectsPage() {
  return (
    <main>
      <h1>Manage Projects</h1>

      <div className="admin-project-list">
        {projects.map((project) => (
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
          </div>
        ))}
      </div>
    </main>
  );
}

export default AdminProjectsPage;
