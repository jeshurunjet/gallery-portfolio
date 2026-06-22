import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProjectCard from "../components/ProjectCard";
import useProjects from "../hooks/useProjects";
import LoadingPage from "../components/LoadingPage";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { contentJsonToPlainText } from "../utils/projectContentMigration";

type HomeSortOption = "recent" | "views" | "likes" | "az";

function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { projects, loading, progress } = useProjects();
  const search = searchParams.get("search") ?? "";
  const sort = (searchParams.get("sort") as HomeSortOption) ?? "recent";
  const selectedTag = searchParams.get("tag");
  const [showAllTags, setShowAllTags] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortOptions: { value: HomeSortOption; label: string }[] = [
    { value: "recent", label: "Recent" },
    { value: "views", label: "Most viewed" },
    { value: "likes", label: "Most liked" },
    { value: "az", label: "A-Z" },
  ];

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
        contentJsonToPlainText(project.contentJson).toLowerCase().includes(normalizedSearch) ||
        project.category.toLowerCase().includes(normalizedSearch) ||
        project.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch));

      const matchesTag = selectedTag ? project.tags.includes(selectedTag) : true;

      return matchesSearch && matchesTag;
    });

    return [...matches].sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }

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
    setIsSortOpen(false);
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

        <div className="gallery-sort-menu">
          <button
            type="button"
            className="gallery-sort-trigger"
            aria-expanded={isSortOpen}
            aria-haspopup="menu"
            onClick={() => setIsSortOpen((prev) => !prev)}
          >
            <SlidersHorizontal size={17} />
            <span>{sortOptions.find((option) => option.value === sort)?.label}</span>
            <ChevronDown size={16} />
          </button>

          {isSortOpen && (
            <div className="gallery-sort-dropdown" role="menu">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={sort === option.value}
                  className={sort === option.value ? "active" : ""}
                  onClick={() => handleSortChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
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
