import { useParams } from "react-router-dom";

function AdminEditProjectPage() {
  const { id } = useParams();

  return (
    <main>
      <h1>Edit Project {id}</h1>
      <p>This page will contain the edit project form.</p>
    </main>
  );
}

export default AdminEditProjectPage;
