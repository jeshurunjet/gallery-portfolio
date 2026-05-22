import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProjectCard from "../components/ProjectCard";
import useProjects from "../hooks/useProjects";
import LoadingPage from "../components/LoadingPage";
import { Search } from "lucide-react";

type HomeSortOption = "recent" | "views" | "likes" | "az";

function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { projects, loading, progress } = useProjects();
  const search = searchParams.get("search") ?? "";
  const sort = (searchParams.get("sort") as HomeSortOption) ?? "recent";
  const selectedTag = searchParams.get("tag");
  const [showAllTags, setShowAllTags] = useState(false);

  const availableTags = useMemo(() => {
    const allTags = projects.flatMap((project) => project.tags);
    return [...new Set(allTags)].sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const matches = projects.filter((project) => {
      const matchesSearch =
        !normalizedSearch ||
        project.title.toLowerCase().includes(normalizedSearch) ||
        project.description.toLowerCase().includes(normalizedSearch) ||
        project.category.toLowerCase().includes(normalizedSearch) ||
        project.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch));

      const matchesTag = selectedTag ? project.tags.includes(selectedTag) : true;

      return matchesSearch && matchesTag;
    });

    return [...matches].sort((a, b) => {
      switch (sort) {
        case "views":
          return (b.views ?? 0) - (a.views ?? 0);
        case "likes":
          return (b.likes ?? 0) - (a.likes ?? 0);
        case "az":
          return a.title.localeCompare(b.title);
        default:
          return b.id - a.id;
      }
    });
  }, [projects, search, selectedTag, sort]);

  const handleSearchChange = (value: string) => {
    const nextParams = new URLSearchParams(searchParams);

    if (value.trim()) {
      nextParams.set("search", value);
    } else {
      nextParams.delete("search");
    }

    setSearchParams(nextParams);
  };

  const handleSortChange = (value: HomeSortOption) => {
    const nextParams = new URLSearchParams(searchParams);

    if (value === "recent") {
      nextParams.delete("sort");
    } else {
      nextParams.set("sort", value);
    }

    setSearchParams(nextParams);
  };

  const handleTagClick = (tag: string) => {
    const nextParams = new URLSearchParams(searchParams);

    if (selectedTag === tag) {
      nextParams.delete("tag");
    } else {
      nextParams.set("tag", tag);
    }

    setSearchParams(nextParams);
  };

  if (loading) {
    return <LoadingPage progress={progress} />;
  }

  const visibleTags = showAllTags ? availableTags : availableTags.slice(0, 8);
  const hiddenTagCount = availableTags.length - visibleTags.length;

  return (
    <main>
      <h1>Gallery</h1>
      <p>Explore creative, technical, and research-based projects.</p>

      <section className="gallery-controls">
        <label className="gallery-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </label>

        <div className="gallery-sort-tabs" aria-label="Project sort options">
          {[
            ["recent", "Recent"],
            ["views", "Most viewed"],
            ["likes", "Most liked"],
            ["az", "A-Z"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={sort === value ? "active" : ""}
              onClick={() => handleSortChange(value as HomeSortOption)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <div className="tag-filter">
        {visibleTags.map((tag) => (
          <button
            key={tag}
            className={`tag-button ${selectedTag === tag ? "active" : ""}`}
            onClick={() => handleTagClick(tag)}
            type="button"
          >
            #{tag}
          </button>
        ))}

        {availableTags.length > 8 && (
          <button
            className="tag-button tag-toggle-button"
            onClick={() => setShowAllTags((prev) => !prev)}
            type="button"
          >
            {showAllTags ? "Show less" : `+${hiddenTagCount} more`}
          </button>
        )}
      </div>

      <p className="gallery-result-count">
        Showing {filteredProjects.length} of {projects.length} project
        {projects.length === 1 ? "" : "s"}
      </p>

      {filteredProjects.length === 0 ? (
        <p className="empty-state">No projects matched your search.</p>
      ) : (
        <div className="grid">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </main>
  );
}

export default HomePage;
