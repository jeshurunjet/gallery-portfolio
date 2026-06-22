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
import TypingText from "../components/TypingText";

const strengthIcons: Record<AboutStrengthIcon, ReactNode> = {
  code: <Code2 size={50} strokeWidth={1.8} />,
  palette: <Palette size={50} strokeWidth={1.8} />,
  heart: <HeartHandshake size={50} strokeWidth={1.8} />,
  rocket: <Rocket size={50} strokeWidth={1.8} />,
};

function AboutPage() {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/pages/about`);

        if (!response.ok) {
          setContent(defaultAboutContent);
          return;
        }

        const data: PageContentResponse = await response.json();
        setContent(parsePageContent(data.content, defaultAboutContent));
      } catch (error) {
        console.error("Failed to load about content:", error);
        setContent(defaultAboutContent);
      } finally {
        setIsLoading(false);
      }
    };

    void loadContent();
  }, []);

  if (isLoading || !content) {
    return <main className="about-page" aria-busy="true" />;
  }

  return (
    <main className="about-page">
      <section className="about-hero about-hero-featured">
        <div className="about-hero-copy">
          <p className="eyebrow">{content.heroEyebrow}</p>
          <h1 className="about-typing-line">
            <TypingText phrases={content.animatedPhrases} />
          </h1>
          {content.heroParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <aside className="about-hero-side">
          <div className="about-card about-profile-card">
            <h2>{content.focusTitle}</h2>
            <p>{content.focusText}</p>
            <div className="about-focus-list">
              {content.focusAreas.map((item) => (
                <div key={item} className="about-focus-item">
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="about-layout">
        <div className="about-main">
          <section className="about-section about-statement-panel">
            <p className="eyebrow">Approach</p>
            <h2>Design-aware engineering with a practical delivery mindset.</h2>
            <p>{content.statement}</p>
          </section>

          <section className="about-section about-strengths-panel">
            <div className="about-section-heading">
              <div>
                <p className="eyebrow">Strengths</p>
                <h2>What I bring into a project.</h2>
              </div>
            </div>

            <div className="about-grid about-strength-grid">
              {content.strengths.map((item, index) => (
                <div
                  key={item.title}
                  className="about-strength-card"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <span className="about-card-icon">
                    {strengthIcons[item.icon]}
                  </span>
                  <div className="about-strength-copy">
                    <span className="about-strength-index">0{index + 1}</span>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="about-sidebar">
          <section className="about-section about-career-note">
            <div>
              <p className="eyebrow">{content.experienceEyebrow}</p>
              <h2>{content.experienceTitle}</h2>
            </div>
            <p>{content.experienceText}</p>
          </section>
        </aside>
      </section>
    </main>
  );
}

export default AboutPage;
