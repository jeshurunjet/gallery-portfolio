import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ExternalLink, Code2, Globe, ThumbsUp, Eye } from "lucide-react";
import useProjects from "../hooks/useProjects";
import ImageGallery from "../components/ImageGallery";
import VideoPlayer from "../components/VideoPlayer";
import AudioPlayer from "../components/AudioPlayer";
import PdfViewer from "../components/PdfViewer";
import CodeViewer from "../components/CodeViewer";
import { API_BASE_URL } from "../config";
import ProjectRichTextRenderer from "../components/ProjectRichTextRenderer";

function ProjectPage() {
  const { id } = useParams();
  const { projects, refreshProjects } = useProjects();
  const navigate = useNavigate();

  const project = projects.find((item) => item.id === Number(id ?? 0));
  const hasCountedView = useRef(false);

  const [, forceLikeRender] = useState(0);
  const [localLikesById, setLocalLikesById] = useState<Record<number, number>>(
    {}
  );

  useEffect(() => {
    if (!project?.id || hasCountedView.current) return;

    hasCountedView.current = true;

    fetch(`${API_BASE_URL}/api/projects/${project.id}/view`, {
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

  const likedKey = `liked-${project.id}`;
  const hasLiked = localStorage.getItem(likedKey) === "true";

  const tags = project.tags ?? [];
  const visibleTags = tags.slice(0, 3);
  const galleryImages = project.galleryImages ?? [];
  const videos =
    project.videos ??
    (project.videoUrl ? [{ url: project.videoUrl, publicId: project.videoPublicId }] : []);
  const audios =
    project.audios ??
    (project.audioUrl ? [{ url: project.audioUrl, publicId: project.audioPublicId }] : []);
  const pdfs =
    project.pdfs ??
    (project.pdfUrl ? [{ url: project.pdfUrl, publicId: project.pdfPublicId }] : []);
  const category = project.category ?? "Uncategorized";
  const likes = localLikesById[project.id] ?? project.likes ?? 0;
  const views = project.views ?? 0;
  const contentJson = project.contentJson ?? null;
  const facts = project.facts;
  const hasHeroMedia =
    videos.length > 0 ||
    audios.length > 0 ||
    Boolean(project.codeContent) ||
    galleryImages.length > 0;
  const projectLinks = [
    project.liveUrl
      ? {
          href: project.liveUrl,
          label: "Live Demo",
          icon: <Globe size={18} />,
        }
      : null,
    project.githubUrl
      ? {
          href: project.githubUrl,
          label: "GitHub",
          icon: <Code2 size={18} />,
        }
      : null,
    project.externalUrl
      ? {
          href: project.externalUrl,
          label: "External",
          icon: <ExternalLink size={18} />,
        }
      : null,
  ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode }[];
  const hasProjectAside = projectLinks.length > 0 || tags.length > 0 || Boolean(facts);

  const handleLike = async () => {
    if (hasLiked) return;

    const previousLikes = likes;

    localStorage.setItem(likedKey, "true");
    forceLikeRender((prev) => prev + 1);

    setLocalLikesById((prev) => ({
      ...prev,
      [project.id]: previousLikes + 1,
    }));

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${project.id}/like`,
        { method: "PUT" }
      );

      if (!response.ok) {
        throw new Error("Failed to like project");
      }

      await refreshProjects();
    } catch (error) {
      console.error("Failed to like project:", error);

      localStorage.removeItem(likedKey);
      forceLikeRender((prev) => prev + 1);

      setLocalLikesById((prev) => ({
        ...prev,
        [project.id]: previousLikes,
      }));
    }
  };

  return (
    <main className="project-page">
      <button className="back-button" onClick={() => navigate(-1)}>
        ← Back
      </button>

      {hasHeroMedia && (
        <div className="project-hero">
          {videos.map((video, index) => (
            <VideoPlayer
              key={`video-${video.publicId ?? video.url ?? index}`}
              url={video.url}
            />
          ))}
          {audios.map((audio, index) => (
            <AudioPlayer
              key={`audio-${audio.publicId ?? audio.url ?? index}`}
              url={audio.url}
            />
          ))}
          {project.codeContent && <CodeViewer code={project.codeContent} />}

          {galleryImages.length > 0 && (
            <ImageGallery
              images={galleryImages}
              title={project.title}
              autoScroll={project.galleryAutoScroll ?? true}
              showThumbnails={project.galleryShowThumbnails ?? true}
            />
          )}
        </div>
      )}

      <div className="project-content">
        <div className="project-intro-grid">
          <div className="project-intro-main">
            <p className="project-category">{category}</p>
            <h1>{project.title}</h1>

            <div className="project-stats">
              <button
                className={`stat-item like-button ${hasLiked ? "liked" : ""}`}
                disabled={hasLiked}
                onClick={handleLike}
              >
                <ThumbsUp size={16} /> {likes}
              </button>

              <div className="stat-item">
                <Eye size={16} /> {views}
              </div>
            </div>

            {contentJson ? (
              <ProjectRichTextRenderer
                content={contentJson}
                className="project-content-flow"
              />
            ) : !hasHeroMedia && pdfs.length === 0 ? (
              <div className="empty-media">
                <p>No media available for this project.</p>
              </div>
            ) : null}
          </div>

          {hasProjectAside && (
            <aside className="project-intro-side">
              {projectLinks.length > 0 && (
                <div className="project-side-section">
                  <span className="project-side-label">Project Links</span>
                  <div className="project-links" aria-label="Project links">
                    {projectLinks.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="project-link-button"
                        aria-label={link.label}
                        title={link.label}
                      >
                        {link.icon}
                        <span>{link.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {tags.length > 0 && (
                <div className="project-side-section project-tags">
                  <span className="project-side-label">Tags</span>
                  <div className="project-tags-list">
                    {visibleTags.map((tag, index) => (
                      <span key={`${tag}-${index}`} className="tag">
                        #{tag}
                      </span>
                    ))}
                    {tags.length > 3 && (
                      <span className="tag">+{tags.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}

              {facts && (
                <div className="project-side-section">
                  <span className="project-side-label">Project Facts</span>
                  <div className="project-facts">
                    {facts.role && (
                      <div>
                        <strong>Role</strong>
                        <span>{facts.role}</span>
                      </div>
                    )}

                    {facts.year && (
                      <div>
                        <strong>Year</strong>
                        <span>{facts.year}</span>
                      </div>
                    )}

                    {facts.tools && (
                      <div>
                        <strong>Tools</strong>
                        <span>{facts.tools.join(", ")}</span>
                      </div>
                    )}

                    {facts.category && (
                      <div>
                        <strong>Category</strong>
                        <span>{facts.category}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </aside>
          )}
        </div>

        {pdfs.length > 0 && (
          <div className="project-full-section">
            {pdfs.map((pdf, index) => (
              <PdfViewer
                key={`pdf-${pdf.publicId ?? pdf.url ?? index}`}
                url={pdf.url}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default ProjectPage;
