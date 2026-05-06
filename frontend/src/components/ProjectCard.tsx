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
import { ThumbsUp, Eye } from "lucide-react";

function ProjectCard({ project }: { project: Project }) {
  const types = project.types ?? [];
  const tags = project.tags ?? [];
  const category = project.category ?? "Uncategorized";

  return (
    <Link to={`/project/${project.id}`} className="card-link">
      <div className="card">
        <div className="card-image">
          {project.cover && project.cover.trim() !== "" ? (
            <img src={project.cover} alt={project.title} />
          ) : (
            <div className="card-image-fallback">
              <span>No cover image</span>
            </div>
          )}

          <div className="card-icons">
            {types.includes("image") && <ImageIcon size={16} />}
            {types.includes("video") && <Video size={16} />}
            {types.includes("audio") && <Headphones size={16} />}
            {types.includes("code") && <Code2 size={16} />}
            {types.includes("pdf") && <FileText size={16} />}
            {types.includes("web") && <Globe size={16} />}
          </div>
        </div>

        <div className="card-body">
          <p className="card-category">{category}</p>
          <h3>{project.title}</h3>

          <div className="card-tags">
            {tags.slice(0, 2).map((tag, index) => (
              <span key={`${tag}-${index}`} className="card-tag">
                #{tag}
              </span>
            ))}
            {tags.length > 2 && (
              <span className="card-tag more-tag">+{tags.length - 2} more</span>
            )}
          </div>

          <div className="card-meta">
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
        </div>
      </div>
    </Link>
  );
}

export default ProjectCard;
