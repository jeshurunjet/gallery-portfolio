import { Link } from "react-router-dom";
import { useMemo } from "react";
import useProjects from "../../hooks/useProjects";
import useTags from "../../hooks/useTags";
import {
  AlertCircle,
  Eye,
  FolderKanban,
  Tags,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";

function AdminDashboardPage() {
  const { projects } = useProjects();
  const { tags } = useTags();

  const stats = useMemo(() => {
    const totalProjects = projects.length;

    const totalLikes = projects.reduce(
      (sum, project) => sum + (project.likes ?? 0),
      0
    );

    const totalViews = projects.reduce(
      (sum, project) => sum + (project.views ?? 0),
      0
    );

    const projectTags = projects.flatMap((project) => project.tags ?? []);
    const allUniqueTags = new Set([...tags, ...projectTags]);
    const engagementRate =
      totalViews > 0 ? Math.round((totalLikes / totalViews) * 1000) / 10 : 0;
    const topProject = [...projects].sort((a, b) => {
      const bScore = (b.views ?? 0) + (b.likes ?? 0) * 3;
      const aScore = (a.views ?? 0) + (a.likes ?? 0) * 3;

      return bScore - aScore;
    })[0];
    const projectsNeedingAttention = projects.filter(
      (project) =>
        !project.cover?.trim() ||
        (project.views ?? 0) === 0 ||
        (project.likes ?? 0) === 0 ||
        (project.tags ?? []).length === 0
    );

    return {
      totalProjects,
      totalTags: allUniqueTags.size,
      totalLikes,
      totalViews,
      engagementRate,
      topProject,
      projectsNeedingAttention,
    };
  }, [projects, tags]);

  const recentProjects = projects.slice(-3).reverse();

  return (
    <main>
      <div className="admin-page-header">
        <div>
          <h1>Admin Dashboard</h1>

          <p>Overview of your portfolio content and activity.</p>
        </div>
      </div>

      <section className="admin-hero-panel">
        <div>
          <p className="eyebrow">Admin Overview</p>
          <h2>Portfolio activity at a glance</h2>
          <p>
            Track content health, engagement, and recent project activity from
            one place.
          </p>
        </div>

        <div className="admin-quick-actions">
          <Link to="/admin/projects/new" className="admin-primary-button">
            + New Project
          </Link>
          <Link to="/admin/tags" className="admin-secondary-button">
            Manage Tags
          </Link>
          <Link to="/" className="admin-secondary-button">
            View Site
          </Link>
        </div>
      </section>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <FolderKanban size={20} />
          </div>
          <p className="admin-stat-label">Projects</p>
          <h2>{stats.totalProjects}</h2>
          <small>Total portfolio entries</small>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <Tags size={20} />
          </div>
          <p className="admin-stat-label">Tags</p>
          <h2>{stats.totalTags}</h2>
          <small>Unique tags in use</small>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <ThumbsUp size={20} />
          </div>
          <p className="admin-stat-label">Likes</p>
          <h2>{stats.totalLikes}</h2>
          <small>Across all projects</small>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <Eye size={20} />
          </div>
          <p className="admin-stat-label">Views</p>
          <h2>{stats.totalViews}</h2>
          <small>Across all projects</small>
        </div>
      </div>

      <section className="admin-insight-grid">
        <div className="admin-insight-card admin-top-project-card">
          <div className="admin-section-header">
            <div>
              <p className="admin-stat-label">Top Performer</p>
              <h2>{stats.topProject?.title ?? "No projects yet"}</h2>
            </div>
            <TrendingUp size={22} />
          </div>

          {stats.topProject ? (
            <>
              {stats.topProject.cover?.trim() ? (
                <img
                  src={stats.topProject.cover}
                  alt={stats.topProject.title}
                  className="admin-top-project-image"
                />
              ) : (
                <div className="admin-top-project-image admin-project-image-fallback">
                  No image
                </div>
              )}

              <div className="admin-performance-row">
                <span>
                  <Eye size={16} /> {stats.topProject.views ?? 0} views
                </span>
                <span>
                  <ThumbsUp size={16} /> {stats.topProject.likes ?? 0} likes
                </span>
                <span>{stats.engagementRate}% engagement</span>
              </div>

              <Link
                to={`/admin/projects/${stats.topProject.id}/edit`}
                className="admin-secondary-button"
              >
                Edit top project
              </Link>
            </>
          ) : (
            <p>Create a project to start tracking performance.</p>
          )}
        </div>

        <div className="admin-insight-card">
          <div className="admin-section-header">
            <div>
              <p className="admin-stat-label">Needs Attention</p>
              <h2>{stats.projectsNeedingAttention.length}</h2>
            </div>
            <AlertCircle size={22} />
          </div>
          <p>
            Projects missing covers, tags, likes, or views show up here so you
            can keep the portfolio polished.
          </p>

          <div className="admin-attention-list">
            {stats.projectsNeedingAttention.slice(0, 4).map((project) => (
              <Link key={project.id} to={`/admin/projects/${project.id}/edit`}>
                {project.title}
              </Link>
            ))}
            {stats.projectsNeedingAttention.length === 0 && (
              <span>Everything looks tidy.</span>
            )}
          </div>
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-header">
          <h2>Recent Projects</h2>
          <Link to="/admin/projects" className="admin-secondary-button">
            View All
          </Link>
        </div>

        <div className="admin-project-list">
          {recentProjects.map((project) => {
            const category = project.category ?? "Uncategorized";
            const tags = project.tags ?? [];
            const visibleTags = tags.slice(0, 3);

            return (
              <div key={project.id} className="admin-project-card">
                {project.cover && project.cover.trim() !== "" ? (
                  <img
                    src={project.cover}
                    alt={project.title}
                    className="admin-project-image"
                  />
                ) : (
                  <div className="admin-project-image admin-project-image-fallback">
                    No image
                  </div>
                )}

                <div className="admin-project-info">
                  <h3>{project.title}</h3>
                  <p>{category}</p>

                  <div className="admin-project-tags">
                    {visibleTags.map((tag, index) => (
                      <span key={`${tag}-${index}`} className="admin-tag">
                        #{tag}
                      </span>
                    ))}
                    {tags.length > 3 && (
                      <span className="admin-tag">+{tags.length - 3} more</span>
                    )}
                  </div>
                </div>

                <div className="admin-project-actions">
                  <Link
                    to={`/admin/projects/${project.id}/edit`}
                    className="admin-secondary-button"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default AdminDashboardPage;
