import { Link } from "react-router-dom";
import { useMemo, useEffect, useState } from "react";
import useProjects from "../../hooks/useProjects";
import useTags from "../../hooks/useTags";

function AdminDashboardPage() {
  const { projects } = useProjects();
  const { tags } = useTags();
  const [currentUser, setCurrentUser] = useState<{ email: string } | null>(
    null
  );
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch("http://localhost:8080/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        setCurrentUser(data);
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };

    fetchUser();
  }, []);
  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      "Are you sure you want to delete your account? This cannot be undone."
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:8080/api/auth/delete", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      // logout after deletion
      localStorage.removeItem("token");
      localStorage.removeItem("isAuth");

      window.location.replace("/admin/login");
    } catch (err) {
      alert("Failed to delete account");
      console.error(err);
    }
  };

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
        <div className="account-info">
          {currentUser && (
            <p className="admin-user-info">
              Logged in as: <strong>{currentUser.email}</strong>
            </p>
          )}
          <button className="admin-delete-button" onClick={handleDeleteAccount}>
            Delete Account
          </button>
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

        <div className="admin-project-list">
          {recentProjects.map((project) => {
            const category = project.category ?? "Uncategorized";
            const tags = project.tags ?? [];

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
                    {tags.map((tag, index) => (
                      <span key={`${tag}-${index}`} className="admin-tag">
                        #{tag}
                      </span>
                    ))}
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
