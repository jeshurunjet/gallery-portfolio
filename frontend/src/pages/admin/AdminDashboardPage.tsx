import { Link } from "react-router-dom";
import { useMemo } from "react";
import useProjects from "../../hooks/useProjects";
import useTags from "../../hooks/useTags";

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

    return {
      totalProjects,
      totalTags: allUniqueTags.size,
      totalLikes,
      totalViews,
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

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <p className="admin-stat-label">Projects</p>
          <h2>{stats.totalProjects}</h2>
        </div>

        <div className="admin-stat-card">
          <p className="admin-stat-label">Tags</p>
          <h2>{stats.totalTags}</h2>
        </div>

        <div className="admin-stat-card">
          <p className="admin-stat-label">Likes</p>
          <h2>{stats.totalLikes}</h2>
        </div>

        <div className="admin-stat-card">
          <p className="admin-stat-label">Views</p>
          <h2>{stats.totalViews}</h2>
        </div>
      </div>

      <section className="admin-section">
        <div className="admin-section-header">
          <h2>Recent Projects</h2>
          <Link to="/admin/projects" className="admin-secondary-button">
            View All
          </Link>
        </div>

        <div className="admin-recent-list">
          {recentProjects.map((project) => (
            <div key={project.id} className="admin-recent-row">
              <div className="admin-recent-info">
                <h3>{project.title}</h3>
                <p>{project.category ?? "Uncategorized"}</p>
              </div>

              <Link
                to={`/admin/projects/${project.id}/edit`}
                className="admin-secondary-button"
              >
                Edit
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default AdminDashboardPage;
