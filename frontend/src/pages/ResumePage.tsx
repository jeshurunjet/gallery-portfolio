import { Code2, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";
import {
  defaultResumeContent,
  parsePageContent,
  type PageContentResponse,
  type ResumeContactIcon,
  type ResumeContent,
} from "../data/pageContent";

const contactIcons: Record<ResumeContactIcon, ReactNode> = {
  map: <MapPin size={16} />,
  mail: <Mail size={16} />,
  phone: <Phone size={16} />,
  code: <Code2 size={16} />,
};

function ResumePage() {
  const [content, setContent] = useState<ResumeContent>(defaultResumeContent);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/pages/resume`);

        if (!response.ok) return;

        const data: PageContentResponse = await response.json();
        setContent(parsePageContent(data.content, defaultResumeContent));
      } catch (error) {
        console.error("Failed to load resume content:", error);
      }
    };

    void loadContent();
  }, []);

  return (
    <main className="resume-page">
      <section className="resume-header resume-header-featured">
        <div>
          <p className="eyebrow">{content.eyebrow}</p>
          <h1>{content.name}</h1>
          <p>{content.summary}</p>

          <div className="resume-contact-row">
            {content.contactLinks.map((item) =>
              item.href ? (
                <a key={item.label} href={item.href}>
                  {contactIcons[item.icon]}
                  {item.label}
                </a>
              ) : (
                <span key={item.label}>
                  {contactIcons[item.icon]}
                  {item.label}
                </span>
              )
            )}
          </div>
        </div>

        <div className="resume-quick-card">
          <span>{content.quickCardLabel}</span>
          <a
            href={content.cvUrl}
            className="resume-download"
            target="_blank"
            rel="noreferrer"
          >
            View CV <ExternalLink size={16} />
          </a>
          <p>{content.quickCardText}</p>
        </div>
      </section>

      <section className="resume-layout">
        <div className="resume-main">
          <section className="resume-section resume-profile-section">
            <h2>Profile</h2>
            <p>{content.profile}</p>
          </section>

          <section className="resume-section">
            <h2>Professional Experience</h2>
            {content.experience.map((item) => (
              <article
                className="resume-item resume-experience-item"
                key={item.role}
              >
                <div className="resume-item-heading">
                  <div>
                    <h3>{item.role}</h3>
                    <p>{item.company}</p>
                  </div>
                  <span>{item.period}</span>
                </div>

                {item.meta && <p className="resume-item-meta">{item.meta}</p>}

                <ul>
                  {item.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </section>
        </div>

        <aside className="resume-sidebar">
          <section className="resume-skills-section">
            <h2>Skills Summary</h2>
            <div className="skill-group-list">
              {content.skillGroups.map((group) => (
                <div className="skill-group" key={group.title}>
                  <h3>{group.title}</h3>
                  <div className="skill-list">
                    {group.skills.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2>Education</h2>
            {content.education.map((item) => (
              <div className="resume-sidebar-item" key={item.title}>
                <div className="education-heading">
                  <h3>{item.title}</h3>
                  {item.level && <span>{item.level}</span>}
                </div>
                <p className="education-school">{item.school}</p>
                <p className="education-period">{item.period}</p>
              </div>
            ))}
          </section>

          <section className="resume-portfolio-section">
            <h2>Portfolio</h2>
            <div className="resume-portfolio-links">
              {content.portfolioLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </span>
                  <ExternalLink size={15} />
                </a>
              ))}
            </div>
          </section>

          <section>
            <h2>Referees</h2>
            <p>{content.referees}</p>
          </section>
        </aside>
      </section>
    </main>
  );
}

export default ResumePage;
