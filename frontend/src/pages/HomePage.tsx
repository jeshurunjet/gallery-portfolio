import ProjectCard from "../components/ProjectCard";

const projects = [
  {
    id: 1,
    title: "Photography Series",
    cover: "https://via.placeholder.com/400",
    category: "Photography",
    likes: 120,
    views: 540,
    types: ["image"],
  },
  {
    id: 2,
    title: "UI Design Project",
    cover: "https://via.placeholder.com/400",
    category: "Design",
    likes: 89,
    views: 300,
    types: ["image", "web"],
  },
  {
    id: 3,
    title: "Machine Learning Model",
    cover: "https://via.placeholder.com/400",
    category: "ML",
    likes: 45,
    views: 200,
    types: ["code", "pdf"],
  },
  {
    id: 4,
    title: "Music Production",
    cover: "https://via.placeholder.com/400",
    category: "Audio",
    likes: 60,
    views: 250,
    types: ["audio"],
  },
];

function HomePage() {
  return (
    <main>
      <h1>Gallery</h1>

      <div className="grid">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </main>
  );
}

export default HomePage;
