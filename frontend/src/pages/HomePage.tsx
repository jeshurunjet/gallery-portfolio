import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import ProjectCard from "../components/ProjectCard";
import { projects } from "../data/projects";

function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const selectedTag = searchParams.get("tag");

  const availableTags = useMemo(() => {
    const allTags = projects.flatMap((project) => project.tags);
    return [...new Set(allTags)].sort();
  }, []);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(search.toLowerCase()) ||
      project.description.toLowerCase().includes(search.toLowerCase()) ||
      project.tags.some((tag) =>
        tag.toLowerCase().includes(search.toLowerCase())
      );

    const matchesTag = selectedTag ? project.tags.includes(selectedTag) : true;

    return matchesSearch && matchesTag;
  });

  const handleSearchChange = (value: string) => {
    const nextParams = new URLSearchParams(searchParams);

    if (value.trim()) {
      nextParams.set("search", value);
    } else {
      nextParams.delete("search");
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

  return (
    <main>
      <h1>Gallery</h1>
      <p>Explore creative, technical, and research-based projects.</p>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      <div className="tag-filter">
        {availableTags.map((tag) => (
          <button
            key={tag}
            className={`tag-button ${selectedTag === tag ? "active" : ""}`}
            onClick={() => handleTagClick(tag)}
            type="button"
          >
            #{tag}
          </button>
        ))}
      </div>

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
