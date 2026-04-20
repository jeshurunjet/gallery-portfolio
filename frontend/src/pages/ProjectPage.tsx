import { useParams, useNavigate } from "react-router-dom";
import { projects } from "../data/projects";
import ImageGallery from "../components/ImageGallery";
import VideoPlayer from "../components/VideoPlayer";
import AudioPlayer from "../components/AudioPlayer";
import PdfViewer from "../components/PdfViewer";
import CodeViewer from "../components/CodeViewer";
import ProjectContentRenderer from "../components/ProjectContentRenderer";

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
          <ImageGallery images={project.images} title={project.title} />
        )}
      </div>

      <div className="project-layout">
        <section className="project-main">
          <p className="project-category">{project.category}</p>
          <h1>{project.title}</h1>
          <p className="project-description">{project.description}</p>

          <div className="project-tags">
            {project.tags.map((tag) => (
              <span key={tag} className="tag">
                #{tag}
              </span>
            ))}
          </div>

          {project.content && project.content.length > 0 && (
            <ProjectContentRenderer content={project.content} />
          )}
        </section>

        <aside className="project-side">
          <div className="project-stats">
            <span>❤️ {project.likes}</span>
            <span>👁️ {project.views}</span>
          </div>

          {project.facts && (
            <div className="project-facts">
              {project.facts.role && (
                <div>
                  <strong>Role:</strong> {project.facts.role}
                </div>
              )}
              {project.facts.year && (
                <div>
                  <strong>Year:</strong> {project.facts.year}
                </div>
              )}
              {project.facts.tools && (
                <div>
                  <strong>Tools:</strong> {project.facts.tools.join(", ")}
                </div>
              )}
              {project.facts.category && (
                <div>
                  <strong>Category:</strong> {project.facts.category}
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
