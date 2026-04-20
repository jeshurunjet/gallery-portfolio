import { Link } from "react-router-dom";
import type { Project } from "../data/projects";

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link to={`/project/${project.id}`} className="card-link">
      <div className="card">
        <div className="card-image">
          <img src={project.cover} alt={project.title} />

          <div className="card-icons">
            {project.types.includes("image") && <span>🖼️</span>}
            {project.types.includes("video") && <span>🎬</span>}
            {project.types.includes("audio") && <span>🎧</span>}
            {project.types.includes("code") && <span>💻</span>}
            {project.types.includes("pdf") && <span>📄</span>}
            {project.types.includes("web") && <span>🌐</span>}
          </div>
        </div>

        <div className="card-body">
          <p className="card-category">{project.category}</p>
          <h3>{project.title}</h3>

          <div className="card-tags">
            {project.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="card-tag">
                #{tag}
              </span>
            ))}
          </div>

          <div className="card-meta">
            <span>❤️ {project.likes}</span>
            <span>👁️ {project.views}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ProjectCard;
