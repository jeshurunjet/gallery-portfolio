type Project = {
  id: number;
  title: string;
  cover: string;
  category: string;
  likes: number;
  views: number;
  types: string[]; // image, video, code, pdf, etc.
};

function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="card">
      <div className="card-image">
        <img src={project.cover} alt={project.title} />

        {/* Top-right icons */}
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
        <h3>{project.title}</h3>

        <div className="card-meta">
          <span>❤️ {project.likes}</span>
          <span>👁️ {project.views}</span>
        </div>
      </div>
    </div>
  );
}

export default ProjectCard;
