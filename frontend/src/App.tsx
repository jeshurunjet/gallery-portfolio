import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ResumePage from "./pages/ResumePage";
import LoginPage from "./pages/admin/LoginPage";
import ProjectPage from "./pages/ProjectPage";
import AdminLayout from "./components/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminProjectsPage from "./pages/admin/AdminProjectsPage";
import AdminTagsPage from "./pages/admin/AdminTagsPage";
import AdminNewProjectPage from "./pages/admin/AdminNewProjectPage";
import AdminEditProjectPage from "./pages/admin/AdminEditProjectPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/resume" element={<ResumePage />} />
        <Route path="/project/:id" element={<ProjectPage />} />
        <Route path="/admin/login" element={<LoginPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="projects" element={<AdminProjectsPage />} />
          <Route path="projects/new" element={<AdminNewProjectPage />} />
          <Route path="projects/:id/edit" element={<AdminEditProjectPage />} />
          <Route path="tags" element={<AdminTagsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
