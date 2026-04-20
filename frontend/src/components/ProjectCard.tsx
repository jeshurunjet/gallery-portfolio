import { Link } from "react-router-dom";
import {
  Image as ImageIcon,
  Video,
  Headphones,
  Code2,
  FileText,
  Globe,
} from "lucide-react";
import type { Project } from "../data/projects";

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link to={`/project/${project.id}`} className="card-link">
      <div className="card">
        <div className="card-image">
          <img src={project.cover} alt={project.title} />

          <div className="card-icons">
            {project.types.includes("image") && <ImageIcon size={16} />}
            {project.types.includes("video") && <Video size={16} />}
            {project.types.includes("audio") && <Headphones size={16} />}
            {project.types.includes("code") && <Code2 size={16} />}
            {project.types.includes("pdf") && <FileText size={16} />}
            {project.types.includes("web") && <Globe size={16} />}
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
