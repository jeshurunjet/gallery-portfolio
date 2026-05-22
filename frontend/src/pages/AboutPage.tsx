import { Code2, HeartHandshake, Palette, Rocket } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";
import {
  defaultAboutContent,
  parsePageContent,
  type AboutContent,
  type AboutStrengthIcon,
  type PageContentResponse,
} from "../data/pageContent";

const strengthIcons: Record<AboutStrengthIcon, ReactNode> = {
  code: <Code2 size={22} />,
  palette: <Palette size={22} />,
  heart: <HeartHandshake size={22} />,
  rocket: <Rocket size={22} />,
};

function AboutPage() {
  const [content, setContent] = useState<AboutContent>(defaultAboutContent);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/pages/about`);

        if (!response.ok) return;

        const data: PageContentResponse = await response.json();
        setContent(parsePageContent(data.content, defaultAboutContent));
      } catch (error) {
        console.error("Failed to load about content:", error);
      }
    };

    void loadContent();
  }, []);

  return (
    <main className="about-page">
      <section className="about-hero about-hero-featured">
        <div>
          <p className="eyebrow">{content.heroEyebrow}</p>
          <h1>{content.heroTitle}</h1>
          {content.heroParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="about-card about-profile-card">
          <h2>{content.focusTitle}</h2>
          <p>{content.focusText}</p>
          <div className="about-mini-list">
            {content.focusAreas.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section about-statement">
        <p>{content.statement}</p>
      </section>

      <section className="about-grid about-strength-grid">
        {content.strengths.map((item) => (
          <div key={item.title}>
            <span className="about-card-icon">{strengthIcons[item.icon]}</span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        ))}
      </section>

      <section className="about-section about-career-note">
        <div>
          <p className="eyebrow">{content.experienceEyebrow}</p>
          <h2>{content.experienceTitle}</h2>
        </div>
        <p>{content.experienceText}</p>
      </section>
    </main>
  );
}

export default AboutPage;
