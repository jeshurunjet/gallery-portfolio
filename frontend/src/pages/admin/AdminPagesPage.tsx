import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../../config";
import Toast from "../../components/Toast";
import {
  defaultAboutContent,
  defaultResumeContent,
  type PageContentResponse,
} from "../../data/pageContent";

type EditablePageKey = "about" | "resume";

const pageLabels: Record<EditablePageKey, string> = {
  about: "About",
  resume: "Resume",
};

const defaultContentByPage: Record<EditablePageKey, object> = {
  about: defaultAboutContent,
  resume: defaultResumeContent,
};

function formatJson(value: object) {
  return JSON.stringify(value, null, 2);
}

function AdminPagesPage() {
  const [activePage, setActivePage] = useState<EditablePageKey>("about");
  const [pageContent, setPageContent] = useState<Record<EditablePageKey, string>>({
    about: formatJson(defaultAboutContent),
    resume: formatJson(defaultResumeContent),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const activeContent = pageContent[activePage];

  const jsonError = useMemo(() => {
    try {
      JSON.parse(activeContent);
      return "";
    } catch (error) {
      if (error instanceof Error) return error.message;
      return "Invalid JSON";
    }
  }, [activeContent]);

  useEffect(() => {
    const loadPage = async (pageKey: EditablePageKey) => {
      const response = await fetch(`${API_BASE_URL}/api/pages/${pageKey}`);

      if (!response.ok) {
        return formatJson(defaultContentByPage[pageKey]);
      }

      const data: PageContentResponse = await response.json();
      return formatJson(JSON.parse(data.content));
    };

    const loadPages = async () => {
      try {
        setLoading(true);

        const [about, resume] = await Promise.all([
          loadPage("about"),
          loadPage("resume"),
        ]);

        setPageContent({ about, resume });
      } catch (error) {
        console.error("Failed to load page content:", error);
        setToastMessage("Could not load page content. Showing local defaults.");
        setShowToast(true);
      } finally {
        setLoading(false);
      }
    };

    void loadPages();
  }, []);

  const handleAuthExpired = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isAuth");
    sessionStorage.setItem(
      "authMessage",
      "Your session has expired. Please log in again."
    );
    window.location.replace("/admin/login");
  };

  const handleSave = async () => {
    if (jsonError) {
      setToastMessage("Fix the JSON before saving.");
      setShowToast(true);
      return;
    }

    try {
      setSaving(true);
      const parsedContent = JSON.parse(activeContent);

      const response = await fetch(`${API_BASE_URL}/api/pages/${activePage}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          pageKey: activePage,
          content: JSON.stringify(parsedContent),
        }),
      });

      if (response.status === 401) {
        handleAuthExpired();
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to save ${activePage} content`);
      }

      const savedContent: PageContentResponse = await response.json();
      setPageContent((current) => ({
        ...current,
        [activePage]: formatJson(JSON.parse(savedContent.content)),
      }));
      setToastMessage(`${pageLabels[activePage]} page saved.`);
      setShowToast(true);
    } catch (error) {
      console.error("Failed to save page content:", error);
      setToastMessage("Page content could not be saved.");
      setShowToast(true);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setPageContent((current) => ({
      ...current,
      [activePage]: formatJson(defaultContentByPage[activePage]),
    }));
  };

  return (
    <>
      <main>
        <div className="admin-page-header">
          <div>
            <h1>Edit Pages</h1>
            <p>Update the About and Resume page content stored in the database.</p>
          </div>
        </div>

        <section className="admin-page-editor">
          <div className="admin-sort-tabs" aria-label="Editable pages">
            {(["about", "resume"] as EditablePageKey[]).map((pageKey) => (
              <button
                key={pageKey}
                type="button"
                className={activePage === pageKey ? "active" : ""}
                onClick={() => setActivePage(pageKey)}
              >
                {pageLabels[pageKey]}
              </button>
            ))}
          </div>

          <div className="admin-form-panel">
            <div className="admin-form-panel-header">
              <div>
                <h3>{pageLabels[activePage]} Content</h3>
                <p>
                  Edit the JSON values, lists, and sections. The public page will
                  use this content after saving.
                </p>
              </div>
            </div>

            <div className="admin-form-group">
              <label htmlFor="page-content-json">Page content JSON</label>
              <textarea
                id="page-content-json"
                className="admin-json-editor"
                value={activeContent}
                onChange={(event) =>
                  setPageContent((current) => ({
                    ...current,
                    [activePage]: event.target.value,
                  }))
                }
                spellCheck={false}
                disabled={loading || saving}
              />
              {jsonError ? (
                <small className="admin-error-text">{jsonError}</small>
              ) : (
                <small>JSON is valid.</small>
              )}
            </div>

            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-primary-button"
                onClick={handleSave}
                disabled={loading || saving || Boolean(jsonError)}
              >
                {saving ? "Saving..." : "Save Page"}
              </button>
              <button
                type="button"
                className="admin-secondary-button"
                onClick={handleResetToDefault}
                disabled={loading || saving}
              >
                Reset Local Default
              </button>
            </div>
          </div>
        </section>
      </main>

      {showToast && (
        <Toast message={toastMessage} onClose={() => setShowToast(false)} />
      )}
    </>
  );
}

export default AdminPagesPage;
