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
import RegisterPage from "./pages/admin/RegisterPage";
import ResetPasswordPage from "./pages/admin/ResetPasswordPage";
import ForgotPasswordPage from "./pages/admin/ForgotPasswordPage";
import Footer from "./components/Footer";

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/resume" element={<ResumePage />} />
            <Route path="/project/:id" element={<ProjectPage />} />
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/admin/register" element={<RegisterPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
              <Route
                path="projects/:id/edit"
                element={<AdminEditProjectPage />}
              />
              <Route path="tags" element={<AdminTagsPage />} />
            </Route>
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
