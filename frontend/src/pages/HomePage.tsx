import ProjectCard from "../components/ProjectCard";
import { projects } from "../data/projects";

function HomePage() {
  return (
    <main>
      <h1>Gallery</h1>
      <p>Explore creative, technical, and research-based projects.</p>

      <div className="grid">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </main>
  );
}

export default HomePage;
