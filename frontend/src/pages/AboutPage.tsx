import { Code2, HeartHandshake, Palette, Rocket } from "lucide-react";

const focusAreas = [
  "Full-stack web development",
  "Front-end engineering",
  "UI and graphic design",
  "Cloud deployment",
  "Digital solutions for small teams",
];

const strengths = [
  {
    title: "Build",
    icon: <Code2 size={22} />,
    text: "React, Next.js, Vite, NodeJS, PHP, Java, Spring Boot, Firebase, PostgreSQL, and deployment workflows.",
  },
  {
    title: "Design",
    icon: <Palette size={22} />,
    text: "Visual identity, layouts, icons, sprites, web interfaces, print-ready material, and digital brand assets.",
  },
  {
    title: "Coordinate",
    icon: <HeartHandshake size={22} />,
    text: "Several years of support work strengthened my communication, planning, documentation, and stakeholder coordination.",
  },
  {
    title: "Launch",
    icon: <Rocket size={22} />,
    text: "I enjoy moving ideas from early sketches into working, hosted, usable websites and tools.",
  },
];

function AboutPage() {
  return (
    <main className="about-page">
      <section className="about-hero about-hero-featured">
        <div>
          <p className="eyebrow">About Me</p>
          <h1>Full-stack developer with a designer's eye.</h1>
          <p>
            I am a web and cloud development professional based in Auckland,
            New Zealand, with experience across full-stack development,
            front-end engineering, UI design, graphic design, and digital
            solutions.
          </p>
          <p>
            After several years in disability support work, I am transitioning
            back into IT with a practical mix of technical skill, creative
            production, and client-facing experience.
          </p>
        </div>

        <div className="about-card about-profile-card">
          <h2>Current Focus</h2>
          <p>
            Completing a Level 8 Diploma in Computer Science at AUT while
            building web projects for businesses, community groups, and my own
            portfolio.
          </p>
          <div className="about-mini-list">
            {focusAreas.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section about-statement">
        <p>
          My work sits between design and engineering. I can plan interfaces,
          create assets, build responsive front ends, connect data, and deploy
          projects. I also bring a service mindset from support work: clear
          communication, patience, documentation, and care for the people using
          the final product.
        </p>
      </section>

      <section className="about-grid about-strength-grid">
        {strengths.map((item) => (
          <div key={item.title}>
            <span className="about-card-icon">{item.icon}</span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        ))}
      </section>

      <section className="about-section about-career-note">
        <div>
          <p className="eyebrow">Experience</p>
          <h2>Creative, technical, and people-focused work.</h2>
        </div>
        <p>
          I have worked as a web developer, full-stack developer, front-end
          developer, graphic designer, video-photographer, and support worker.
          That background gives me a broad view of digital projects: how they
          look, how they work, how they are maintained, and how they support
          real people.
        </p>
      </section>
    </main>
  );
}

export default AboutPage;
