import { Link } from "react-router-dom";
import { useMemo } from "react";
import { projects } from "../../data/projects";

function AdminDashboardPage() {
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const totalLikes = projects.reduce(
      (sum, project) => sum + project.likes,
      0
    );
    const totalViews = projects.reduce(
      (sum, project) => sum + project.views,
      0
    );

    const allTags = projects.flatMap((project) => project.tags);
    const totalTags = new Set(allTags).size;

    return {
      totalProjects,
      totalTags,
      totalLikes,
      totalViews,
    };
  }, []);

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
                <p>{project.category}</p>
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
