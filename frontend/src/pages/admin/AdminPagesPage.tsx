import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../../config";
import Toast from "../../components/Toast";
import {
  defaultAboutContent,
  defaultResumeContent,
  parsePageContent,
  type AboutContent,
  type AboutStrength,
  type AboutStrengthIcon,
  type PageContentResponse,
  type ResumeContactIcon,
  type ResumeContactLink,
  type ResumeContent,
  type ResumeEducation,
  type ResumeExperience,
  type ResumePortfolioLink,
  type ResumeSkillGroup,
} from "../../data/pageContent";

type EditablePageKey = "about" | "resume";

const pageLabels: Record<EditablePageKey, string> = {
  about: "About",
  resume: "Resume",
};

const strengthIconOptions: AboutStrengthIcon[] = [
  "code",
  "palette",
  "heart",
  "rocket",
];

const contactIconOptions: ResumeContactIcon[] = ["map", "mail", "phone", "code"];

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinLines(values: string[]) {
  return values.join("\n");
}

function createStrength(): AboutStrength {
  return {
    title: "New strength",
    icon: "code",
    text: "",
  };
}

function createContact(): ResumeContactLink {
  return {
    label: "New contact",
    href: "",
    icon: "mail",
  };
}

function createSkillGroup(): ResumeSkillGroup {
  return {
    title: "New skill group",
    skills: [],
  };
}

function createExperience(): ResumeExperience {
  return {
    role: "New role",
    company: "",
    period: "",
    meta: "",
    points: [],
  };
}

function createEducation(): ResumeEducation {
  return {
    title: "New education",
    level: "",
    school: "",
    period: "",
  };
}

function createPortfolioLink(): ResumePortfolioLink {
  return {
    title: "New link",
    description: "",
    href: "",
  };
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="admin-form-group">
      <label>{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 4,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  hint?: string;
}) {
  return (
    <div className="admin-form-group">
      <label>{label}</label>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint && <small>{hint}</small>}
    </div>
  );
}

function AdminPagesPage() {
  const [activePage, setActivePage] = useState<EditablePageKey>("about");
  const [aboutContent, setAboutContent] =
    useState<AboutContent>(defaultAboutContent);
  const [resumeContent, setResumeContent] =
    useState<ResumeContent>(defaultResumeContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const activeContent = activePage === "about" ? aboutContent : resumeContent;
  const activeSummary = useMemo(() => {
    if (activePage === "about") {
      return `${aboutContent.focusAreas.length} focus areas, ${aboutContent.strengths.length} strengths`;
    }

    return `${resumeContent.experience.length} roles, ${resumeContent.skillGroups.length} skill groups`;
  }, [aboutContent, activePage, resumeContent]);

  useEffect(() => {
    const loadPages = async () => {
      try {
        setLoading(true);

        const [aboutResponse, resumeResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/pages/about`),
          fetch(`${API_BASE_URL}/api/pages/resume`),
        ]);

        if (aboutResponse.ok) {
          const data: PageContentResponse = await aboutResponse.json();
          setAboutContent(parsePageContent(data.content, defaultAboutContent));
        }

        if (resumeResponse.ok) {
          const data: PageContentResponse = await resumeResponse.json();
          setResumeContent(parsePageContent(data.content, defaultResumeContent));
        }
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
    try {
      setSaving(true);

      const response = await fetch(`${API_BASE_URL}/api/pages/${activePage}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          pageKey: activePage,
          content: JSON.stringify(activeContent),
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

      if (activePage === "about") {
        setAboutContent(parsePageContent(savedContent.content, defaultAboutContent));
      } else {
        setResumeContent(
          parsePageContent(savedContent.content, defaultResumeContent)
        );
      }

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
    if (activePage === "about") {
      setAboutContent(defaultAboutContent);
    } else {
      setResumeContent(defaultResumeContent);
    }
  };

  const updateAbout = <Key extends keyof AboutContent>(
    key: Key,
    value: AboutContent[Key]
  ) => {
    setAboutContent((current) => ({ ...current, [key]: value }));
  };

  const updateResume = <Key extends keyof ResumeContent>(
    key: Key,
    value: ResumeContent[Key]
  ) => {
    setResumeContent((current) => ({ ...current, [key]: value }));
  };

  const moveAboutStrength = (index: number, direction: -1 | 1) => {
    setAboutContent((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.strengths.length) return current;

      const strengths = [...current.strengths];
      [strengths[index], strengths[nextIndex]] = [
        strengths[nextIndex],
        strengths[index],
      ];

      return { ...current, strengths };
    });
  };

  const moveResumeItem = <Key extends keyof ResumeContent>(
    key: Key,
    index: number,
    direction: -1 | 1
  ) => {
    setResumeContent((current) => {
      const list = current[key];
      if (!Array.isArray(list)) return current;

      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= list.length) return current;

      const updatedList = [...list];
      [updatedList[index], updatedList[nextIndex]] = [
        updatedList[nextIndex],
        updatedList[index],
      ];

      return { ...current, [key]: updatedList };
    });
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
          <div className="admin-page-toolbar">
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

            <span className="admin-page-summary">{activeSummary}</span>
          </div>

          {activePage === "about" ? (
            <div className="admin-page-form">
              <section className="admin-form-panel">
                <div className="admin-form-panel-header">
                  <h3>Hero</h3>
                  <p>Main introduction shown at the top of the About page.</p>
                </div>
                <div className="admin-form-grid">
                  <TextInput
                    label="Eyebrow"
                    value={aboutContent.heroEyebrow}
                    onChange={(value) => updateAbout("heroEyebrow", value)}
                  />
                  <TextInput
                    label="Headline"
                    value={aboutContent.heroTitle}
                    onChange={(value) => updateAbout("heroTitle", value)}
                  />
                </div>
                <TextArea
                  label="Intro paragraphs"
                  value={joinLines(aboutContent.heroParagraphs)}
                  onChange={(value) =>
                    updateAbout("heroParagraphs", splitLines(value))
                  }
                  hint="One paragraph per line."
                  rows={5}
                />
              </section>

              <section className="admin-form-panel">
                <div className="admin-form-panel-header">
                  <h3>Current Focus</h3>
                  <p>Small card beside the About page introduction.</p>
                </div>
                <TextInput
                  label="Card title"
                  value={aboutContent.focusTitle}
                  onChange={(value) => updateAbout("focusTitle", value)}
                />
                <TextArea
                  label="Card text"
                  value={aboutContent.focusText}
                  onChange={(value) => updateAbout("focusText", value)}
                />
                <TextArea
                  label="Focus areas"
                  value={joinLines(aboutContent.focusAreas)}
                  onChange={(value) => updateAbout("focusAreas", splitLines(value))}
                  hint="One focus area per line."
                />
              </section>

              <section className="admin-form-panel">
                <div className="admin-form-panel-header">
                  <h3>Statement</h3>
                  <p>Full-width paragraph between the hero and strengths.</p>
                </div>
                <TextArea
                  label="Statement"
                  value={aboutContent.statement}
                  onChange={(value) => updateAbout("statement", value)}
                  rows={5}
                />
              </section>

              <section className="admin-form-panel">
                <div className="admin-form-panel-header">
                  <h3>Strengths</h3>
                  <p>Cards shown in the About page strength grid.</p>
                </div>
                <div className="admin-edit-list">
                  {aboutContent.strengths.map((item, index) => (
                    <article className="admin-edit-item" key={`${item.title}-${index}`}>
                      <div className="admin-edit-item-header">
                        <strong>{item.title || `Strength ${index + 1}`}</strong>
                        <div className="admin-edit-actions">
                          <button
                            type="button"
                            className="admin-secondary-button"
                            onClick={() => moveAboutStrength(index, -1)}
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            className="admin-secondary-button"
                            onClick={() => moveAboutStrength(index, 1)}
                          >
                            Down
                          </button>
                          <button
                            type="button"
                            className="admin-danger-button"
                            onClick={() =>
                              updateAbout(
                                "strengths",
                                aboutContent.strengths.filter(
                                  (_, itemIndex) => itemIndex !== index
                                )
                              )
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="admin-form-grid">
                        <TextInput
                          label="Title"
                          value={item.title}
                          onChange={(value) =>
                            updateAbout(
                              "strengths",
                              aboutContent.strengths.map((strength, itemIndex) =>
                                itemIndex === index
                                  ? { ...strength, title: value }
                                  : strength
                              )
                            )
                          }
                        />
                        <div className="admin-form-group">
                          <label>Icon</label>
                          <select
                            value={item.icon}
                            onChange={(event) =>
                              updateAbout(
                                "strengths",
                                aboutContent.strengths.map((strength, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...strength,
                                        icon: event.target.value as AboutStrengthIcon,
                                      }
                                    : strength
                                )
                              )
                            }
                          >
                            {strengthIconOptions.map((icon) => (
                              <option key={icon} value={icon}>
                                {icon}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <TextArea
                        label="Text"
                        value={item.text}
                        onChange={(value) =>
                          updateAbout(
                            "strengths",
                            aboutContent.strengths.map((strength, itemIndex) =>
                              itemIndex === index
                                ? { ...strength, text: value }
                                : strength
                            )
                          )
                        }
                      />
                    </article>
                  ))}
                </div>
                <button
                  type="button"
                  className="admin-secondary-button admin-add-row-button"
                  onClick={() =>
                    updateAbout("strengths", [
                      ...aboutContent.strengths,
                      createStrength(),
                    ])
                  }
                >
                  Add Strength
                </button>
              </section>

              <section className="admin-form-panel">
                <div className="admin-form-panel-header">
                  <h3>Experience Note</h3>
                  <p>Closing section at the bottom of the About page.</p>
                </div>
                <div className="admin-form-grid">
                  <TextInput
                    label="Eyebrow"
                    value={aboutContent.experienceEyebrow}
                    onChange={(value) => updateAbout("experienceEyebrow", value)}
                  />
                  <TextInput
                    label="Title"
                    value={aboutContent.experienceTitle}
                    onChange={(value) => updateAbout("experienceTitle", value)}
                  />
                </div>
                <TextArea
                  label="Text"
                  value={aboutContent.experienceText}
                  onChange={(value) => updateAbout("experienceText", value)}
                />
              </section>
            </div>
          ) : (
            <div className="admin-page-form">
              <section className="admin-form-panel">
                <div className="admin-form-panel-header">
                  <h3>Resume Header</h3>
                  <p>Name, summary, and CV link shown at the top.</p>
                </div>
                <div className="admin-form-grid">
                  <TextInput
                    label="Eyebrow"
                    value={resumeContent.eyebrow}
                    onChange={(value) => updateResume("eyebrow", value)}
                  />
                  <TextInput
                    label="Name"
                    value={resumeContent.name}
                    onChange={(value) => updateResume("name", value)}
                  />
                </div>
                <TextArea
                  label="Summary"
                  value={resumeContent.summary}
                  onChange={(value) => updateResume("summary", value)}
                />
                <TextInput
                  label="CV URL"
                  value={resumeContent.cvUrl}
                  onChange={(value) => updateResume("cvUrl", value)}
                />
                <div className="admin-form-grid">
                  <TextInput
                    label="Quick card label"
                    value={resumeContent.quickCardLabel}
                    onChange={(value) => updateResume("quickCardLabel", value)}
                  />
                  <TextInput
                    label="Quick card text"
                    value={resumeContent.quickCardText}
                    onChange={(value) => updateResume("quickCardText", value)}
                  />
                </div>
              </section>

              <section className="admin-form-panel">
                <div className="admin-form-panel-header">
                  <h3>Contact Links</h3>
                  <p>Location, email, phone, GitHub, and other header links.</p>
                </div>
                <div className="admin-edit-list">
                  {resumeContent.contactLinks.map((item, index) => (
                    <article className="admin-edit-item compact" key={`${item.label}-${index}`}>
                      <div className="admin-edit-item-header">
                        <strong>{item.label || `Contact ${index + 1}`}</strong>
                        <button
                          type="button"
                          className="admin-danger-button"
                          onClick={() =>
                            updateResume(
                              "contactLinks",
                              resumeContent.contactLinks.filter(
                                (_, itemIndex) => itemIndex !== index
                              )
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                      <div className="admin-form-grid">
                        <TextInput
                          label="Label"
                          value={item.label}
                          onChange={(value) =>
                            updateResume(
                              "contactLinks",
                              resumeContent.contactLinks.map((contact, itemIndex) =>
                                itemIndex === index
                                  ? { ...contact, label: value }
                                  : contact
                              )
                            )
                          }
                        />
                        <TextInput
                          label="Link"
                          value={item.href ?? ""}
                          placeholder="mailto:, tel:, or https://"
                          onChange={(value) =>
                            updateResume(
                              "contactLinks",
                              resumeContent.contactLinks.map((contact, itemIndex) =>
                                itemIndex === index
                                  ? { ...contact, href: value }
                                  : contact
                              )
                            )
                          }
                        />
                      </div>
                      <div className="admin-form-group">
                        <label>Icon</label>
                        <select
                          value={item.icon}
                          onChange={(event) =>
                            updateResume(
                              "contactLinks",
                              resumeContent.contactLinks.map((contact, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...contact,
                                      icon: event.target.value as ResumeContactIcon,
                                    }
                                  : contact
                              )
                            )
                          }
                        >
                          {contactIconOptions.map((icon) => (
                            <option key={icon} value={icon}>
                              {icon}
                            </option>
                          ))}
                        </select>
                      </div>
                    </article>
                  ))}
                </div>
                <button
                  type="button"
                  className="admin-secondary-button admin-add-row-button"
                  onClick={() =>
                    updateResume("contactLinks", [
                      ...resumeContent.contactLinks,
                      createContact(),
                    ])
                  }
                >
                  Add Contact
                </button>
              </section>

              <section className="admin-form-panel">
                <div className="admin-form-panel-header">
                  <h3>Profile</h3>
                  <p>Main profile paragraph before professional experience.</p>
                </div>
                <TextArea
                  label="Profile"
                  value={resumeContent.profile}
                  onChange={(value) => updateResume("profile", value)}
                  rows={5}
                />
              </section>

              <section className="admin-form-panel">
                <div className="admin-form-panel-header">
                  <h3>Professional Experience</h3>
                  <p>Resume roles with bullet points.</p>
                </div>
                <div className="admin-edit-list">
                  {resumeContent.experience.map((item, index) => (
                    <article className="admin-edit-item" key={`${item.role}-${index}`}>
                      <div className="admin-edit-item-header">
                        <strong>{item.role || `Role ${index + 1}`}</strong>
                        <div className="admin-edit-actions">
                          <button
                            type="button"
                            className="admin-secondary-button"
                            onClick={() => moveResumeItem("experience", index, -1)}
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            className="admin-secondary-button"
                            onClick={() => moveResumeItem("experience", index, 1)}
                          >
                            Down
                          </button>
                          <button
                            type="button"
                            className="admin-danger-button"
                            onClick={() =>
                              updateResume(
                                "experience",
                                resumeContent.experience.filter(
                                  (_, itemIndex) => itemIndex !== index
                                )
                              )
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="admin-form-grid">
                        <TextInput
                          label="Role"
                          value={item.role}
                          onChange={(value) =>
                            updateResume(
                              "experience",
                              resumeContent.experience.map((role, itemIndex) =>
                                itemIndex === index ? { ...role, role: value } : role
                              )
                            )
                          }
                        />
                        <TextInput
                          label="Company"
                          value={item.company}
                          onChange={(value) =>
                            updateResume(
                              "experience",
                              resumeContent.experience.map((role, itemIndex) =>
                                itemIndex === index
                                  ? { ...role, company: value }
                                  : role
                              )
                            )
                          }
                        />
                        <TextInput
                          label="Period"
                          value={item.period}
                          onChange={(value) =>
                            updateResume(
                              "experience",
                              resumeContent.experience.map((role, itemIndex) =>
                                itemIndex === index
                                  ? { ...role, period: value }
                                  : role
                              )
                            )
                          }
                        />
                        <TextInput
                          label="Meta"
                          value={item.meta ?? ""}
                          onChange={(value) =>
                            updateResume(
                              "experience",
                              resumeContent.experience.map((role, itemIndex) =>
                                itemIndex === index ? { ...role, meta: value } : role
                              )
                            )
                          }
                        />
                      </div>
                      <TextArea
                        label="Bullet points"
                        value={joinLines(item.points)}
                        onChange={(value) =>
                          updateResume(
                            "experience",
                            resumeContent.experience.map((role, itemIndex) =>
                              itemIndex === index
                                ? { ...role, points: splitLines(value) }
                                : role
                            )
                          )
                        }
                        hint="One bullet point per line."
                        rows={6}
                      />
                    </article>
                  ))}
                </div>
                <button
                  type="button"
                  className="admin-secondary-button admin-add-row-button"
                  onClick={() =>
                    updateResume("experience", [
                      ...resumeContent.experience,
                      createExperience(),
                    ])
                  }
                >
                  Add Experience
                </button>
              </section>

              <section className="admin-form-panel">
                <div className="admin-form-panel-header">
                  <h3>Skills</h3>
                  <p>Sidebar skill groups and chips.</p>
                </div>
                <div className="admin-edit-list">
                  {resumeContent.skillGroups.map((group, index) => (
                    <article className="admin-edit-item compact" key={`${group.title}-${index}`}>
                      <div className="admin-edit-item-header">
                        <strong>{group.title || `Skill group ${index + 1}`}</strong>
                        <button
                          type="button"
                          className="admin-danger-button"
                          onClick={() =>
                            updateResume(
                              "skillGroups",
                              resumeContent.skillGroups.filter(
                                (_, itemIndex) => itemIndex !== index
                              )
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                      <TextInput
                        label="Group title"
                        value={group.title}
                        onChange={(value) =>
                          updateResume(
                            "skillGroups",
                            resumeContent.skillGroups.map((skillGroup, itemIndex) =>
                              itemIndex === index
                                ? { ...skillGroup, title: value }
                                : skillGroup
                            )
                          )
                        }
                      />
                      <TextArea
                        label="Skills"
                        value={joinLines(group.skills)}
                        onChange={(value) =>
                          updateResume(
                            "skillGroups",
                            resumeContent.skillGroups.map((skillGroup, itemIndex) =>
                              itemIndex === index
                                ? { ...skillGroup, skills: splitLines(value) }
                                : skillGroup
                            )
                          )
                        }
                        hint="One skill per line."
                      />
                    </article>
                  ))}
                </div>
                <button
                  type="button"
                  className="admin-secondary-button admin-add-row-button"
                  onClick={() =>
                    updateResume("skillGroups", [
                      ...resumeContent.skillGroups,
                      createSkillGroup(),
                    ])
                  }
                >
                  Add Skill Group
                </button>
              </section>

              <section className="admin-form-panel">
                <div className="admin-form-panel-header">
                  <h3>Education</h3>
                  <p>Sidebar education entries.</p>
                </div>
                <div className="admin-edit-list">
                  {resumeContent.education.map((item, index) => (
                    <article className="admin-edit-item compact" key={`${item.title}-${index}`}>
                      <div className="admin-edit-item-header">
                        <strong>{item.title || `Education ${index + 1}`}</strong>
                        <div className="admin-edit-actions">
                          <button
                            type="button"
                            className="admin-secondary-button"
                            onClick={() => moveResumeItem("education", index, -1)}
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            className="admin-secondary-button"
                            onClick={() => moveResumeItem("education", index, 1)}
                          >
                            Down
                          </button>
                          <button
                            type="button"
                            className="admin-danger-button"
                            onClick={() =>
                              updateResume(
                                "education",
                                resumeContent.education.filter(
                                  (_, itemIndex) => itemIndex !== index
                                )
                              )
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="admin-form-grid">
                        <TextInput
                          label="Title"
                          value={item.title}
                          onChange={(value) =>
                            updateResume(
                              "education",
                              resumeContent.education.map((education, itemIndex) =>
                                itemIndex === index
                                  ? { ...education, title: value }
                                  : education
                              )
                            )
                          }
                        />
                        <TextInput
                          label="Level"
                          value={item.level ?? ""}
                          onChange={(value) =>
                            updateResume(
                              "education",
                              resumeContent.education.map((education, itemIndex) =>
                                itemIndex === index
                                  ? { ...education, level: value }
                                  : education
                              )
                            )
                          }
                        />
                        <TextInput
                          label="School"
                          value={item.school}
                          onChange={(value) =>
                            updateResume(
                              "education",
                              resumeContent.education.map((education, itemIndex) =>
                                itemIndex === index
                                  ? { ...education, school: value }
                                  : education
                              )
                            )
                          }
                        />
                        <TextInput
                          label="Period"
                          value={item.period}
                          onChange={(value) =>
                            updateResume(
                              "education",
                              resumeContent.education.map((education, itemIndex) =>
                                itemIndex === index
                                  ? { ...education, period: value }
                                  : education
                              )
                            )
                          }
                        />
                      </div>
                    </article>
                  ))}
                </div>
                <button
                  type="button"
                  className="admin-secondary-button admin-add-row-button"
                  onClick={() =>
                    updateResume("education", [
                      ...resumeContent.education,
                      createEducation(),
                    ])
                  }
                >
                  Add Education
                </button>
              </section>

              <section className="admin-form-panel">
                <div className="admin-form-panel-header">
                  <h3>Portfolio Links</h3>
                  <p>External links shown in the Resume sidebar.</p>
                </div>
                <div className="admin-edit-list">
                  {resumeContent.portfolioLinks.map((item, index) => (
                    <article className="admin-edit-item compact" key={`${item.href}-${index}`}>
                      <div className="admin-edit-item-header">
                        <strong>{item.title || `Link ${index + 1}`}</strong>
                        <button
                          type="button"
                          className="admin-danger-button"
                          onClick={() =>
                            updateResume(
                              "portfolioLinks",
                              resumeContent.portfolioLinks.filter(
                                (_, itemIndex) => itemIndex !== index
                              )
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                      <div className="admin-form-grid">
                        <TextInput
                          label="Title"
                          value={item.title}
                          onChange={(value) =>
                            updateResume(
                              "portfolioLinks",
                              resumeContent.portfolioLinks.map((link, itemIndex) =>
                                itemIndex === index ? { ...link, title: value } : link
                              )
                            )
                          }
                        />
                        <TextInput
                          label="Description"
                          value={item.description}
                          onChange={(value) =>
                            updateResume(
                              "portfolioLinks",
                              resumeContent.portfolioLinks.map((link, itemIndex) =>
                                itemIndex === index
                                  ? { ...link, description: value }
                                  : link
                              )
                            )
                          }
                        />
                      </div>
                      <TextInput
                        label="URL"
                        value={item.href}
                        onChange={(value) =>
                          updateResume(
                            "portfolioLinks",
                            resumeContent.portfolioLinks.map((link, itemIndex) =>
                              itemIndex === index ? { ...link, href: value } : link
                            )
                          )
                        }
                      />
                    </article>
                  ))}
                </div>
                <button
                  type="button"
                  className="admin-secondary-button admin-add-row-button"
                  onClick={() =>
                    updateResume("portfolioLinks", [
                      ...resumeContent.portfolioLinks,
                      createPortfolioLink(),
                    ])
                  }
                >
                  Add Portfolio Link
                </button>
              </section>

              <section className="admin-form-panel">
                <div className="admin-form-panel-header">
                  <h3>Referees</h3>
                  <p>Closing note at the bottom of the Resume sidebar.</p>
                </div>
                <TextInput
                  label="Referees"
                  value={resumeContent.referees}
                  onChange={(value) => updateResume("referees", value)}
                />
              </section>
            </div>
          )}

          <div className="admin-page-savebar">
            <div>
              <strong>{pageLabels[activePage]} page</strong>
              <span>{loading ? "Loading content..." : activeSummary}</span>
            </div>
            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-primary-button"
                onClick={handleSave}
                disabled={loading || saving}
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
