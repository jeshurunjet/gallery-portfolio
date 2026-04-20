import { useParams } from "react-router-dom";

function ProjectPage() {
  const { id } = useParams();

  return (
    <main>
      <h1>Project {id}</h1>
      <p>This is where your project details will go.</p>
    </main>
  );
}

export default ProjectPage;
