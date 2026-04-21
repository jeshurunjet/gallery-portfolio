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
    </main>
  );
}

export default AdminDashboardPage;
