import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ExternalLink, Code2, Globe } from "lucide-react";
import useProjects from "../hooks/useProjects";
import ImageGallery from "../components/ImageGallery";
import VideoPlayer from "../components/VideoPlayer";
import AudioPlayer from "../components/AudioPlayer";
import PdfViewer from "../components/PdfViewer";
import CodeViewer from "../components/CodeViewer";
import ProjectContentRenderer from "../components/ProjectContentRenderer";

function ProjectPage() {
  const { id } = useParams();
  const { projects, refreshProjects } = useProjects();
  const navigate = useNavigate();
  const project = projects.find((item) => item.id === Number(id ?? 0));
  const hasCountedView = useRef(false);

  useEffect(() => {
    if (!project?.id || hasCountedView.current) return;

    hasCountedView.current = true;

    fetch(`http://localhost:8080/api/projects/${project.id}/view`, {
      method: "PUT",
    })
      .then(() => refreshProjects())
      .catch((error) => console.error("Failed to update views:", error));
  }, [project?.id, refreshProjects]);

  if (!project) {
    return (
      <main>
        <h1>Project not found</h1>
        <p>The project you are looking for does not exist.</p>
      </main>
    );
  }

  const tags = project.tags ?? [];
  const images = project.images ?? [];
  const category = project.category ?? "Uncategorized";
  const description = project.description ?? "No description yet.";
  const likes = project.likes ?? 0;
  const views = project.views ?? 0;
  const content = project.content ?? [];
  const facts = project.facts;

  return (
    <main className="project-page">
      <button className="back-button" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="project-hero">
        {project.videoUrl ? (
          <VideoPlayer url={project.videoUrl} />
        ) : project.audioUrl ? (
          <AudioPlayer url={project.audioUrl} />
        ) : project.pdfUrl ? (
          <PdfViewer url={project.pdfUrl} />
        ) : project.codeContent ? (
          <CodeViewer code={project.codeContent} />
        ) : (
          <ImageGallery images={images} title={project.title} />
        )}
      </div>

      <div className="project-layout">
        <section className="project-main">
          <p className="project-category">{category}</p>
          <h1>{project.title}</h1>
          <p className="project-description">{description}</p>

          <div className="project-tags">
            {tags.map((tag, index) => (
              <span key={`${tag}-${index}`} className="tag">
                #{tag}
              </span>
            ))}
          </div>

          {content.length > 0 && <ProjectContentRenderer content={content} />}
        </section>

        <aside className="project-side">
          <div className="project-stats">
            <span>❤️ {likes}</span>
            <span>👁️ {views}</span>
          </div>

          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="project-link-button"
            >
              <Globe size={16} /> Live Demo
            </a>
          )}

          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="project-link-button"
            >
              <Code2 size={16} /> GitHub
            </a>
          )}

          {project.externalUrl && (
            <a
              href={project.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="project-link-button"
            >
              <ExternalLink size={16} /> External
            </a>
          )}

          {facts && (
            <div className="project-facts">
              {facts.role && (
                <div>
                  <strong>Role:</strong> {facts.role}
                </div>
              )}

              {facts.year && (
                <div>
                  <strong>Year:</strong> {facts.year}
                </div>
              )}

              {facts.tools && (
                <div>
                  <strong>Tools:</strong> {facts.tools.join(", ")}
                </div>
              )}

              {facts.category && (
                <div>
                  <strong>Category:</strong> {facts.category}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

export default ProjectPage;
