import { useParams, useNavigate } from "react-router-dom";
import { projects } from "../data/projects";

function ProjectPage() {
  const { id } = useParams();

  const project = projects.find((item) => item.id === Number(id));
  const navigate = useNavigate();

  if (!project) {
    return (
      <main>
        <h1>Project not found</h1>
        <p>The project you are looking for does not exist.</p>
      </main>
    );
  }

  return (
    <main className="project-page">
      <button className="back-button" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="project-wrapper">
        <div className="project-hero">
          <img src={project.cover} alt={project.title} />
        </div>

        <div className="project-content">
          <p className="project-category">{project.category}</p>
          <h1>{project.title}</h1>
          <p className="project-description">{project.description}</p>

          <div className="project-stats">
            <span>❤️ {project.likes}</span>
            <span>👁️ {project.views}</span>
          </div>

          <div className="project-tags">
            {project.tags.map((tag) => (
              <span key={tag} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export default ProjectPage;
