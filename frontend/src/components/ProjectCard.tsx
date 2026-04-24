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
  const types = project.types ?? [];
  const tags = project.tags ?? [];
  const cover =
    project.cover && project.cover.trim() !== ""
      ? project.cover
      : "https://via.placeholder.com/600x400?text=No+Image";
  const category = project.category ?? "Uncategorized";
  const likes = project.likes ?? 0;
  const views = project.views ?? 0;

  return (
    <Link to={`/project/${project.id}`} className="card-link">
      <div className="card">
        <div className="card-image">
          <img src={cover} alt={project.title} />

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
            <span>❤️ {likes}</span>
            <span>👁️ {views}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ProjectCard;
