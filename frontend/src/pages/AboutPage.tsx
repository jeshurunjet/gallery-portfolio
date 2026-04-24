function AboutPage() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <div>
          <p className="eyebrow">About Me</p>
          <h1>Designer, developer, and creative technologist.</h1>
          <p>
            I create visual and technical work across graphic design, web
            design, software engineering, audio, and machine learning.
          </p>
        </div>

        <div className="about-card">
          <h2>Focus Areas</h2>
          <ul>
            <li>Graphic Design</li>
            <li>Frontend Development</li>
            <li>UI / UX Design</li>
            <li>Machine Learning</li>
            <li>Audio & Multimedia</li>
          </ul>
        </div>
      </section>

      <section className="about-section">
        <h2>My Approach</h2>
        <p>
          I enjoy combining design thinking with technical problem solving. My
          work often starts with visual structure, then develops into
          interactive systems, prototypes, websites, or technical projects.
        </p>
      </section>

      <section className="about-grid">
        <div>
          <h3>Design</h3>
          <p>Branding, layout, visual systems, and digital experiences.</p>
        </div>

        <div>
          <h3>Development</h3>
          <p>React, Java, backend APIs, databases, and full-stack projects.</p>
        </div>

        <div>
          <h3>Research & ML</h3>
          <p>
            Machine learning, deep learning, reports, and technical analysis.
          </p>
        </div>
      </section>
    </main>
  );
}

export default AboutPage;
