function ResumePage() {
  return (
    <main className="resume-page">
      <section className="resume-header">
        <div>
          <p className="eyebrow">Resume</p>
          <h1>Jeshurun Sanchez</h1>
          <p>Graphic Designer / Web Designer / Software Engineer</p>
        </div>

        <a href="/resume.pdf" className="resume-download" download>
          Download CV
        </a>
      </section>

      <section className="resume-layout">
        <div className="resume-main">
          <section className="resume-section">
            <h2>Profile</h2>
            <p>
              A multidisciplinary creative and developer with experience across
              design, frontend development, software engineering, and machine
              learning projects.
            </p>
          </section>

          <section className="resume-section">
            <h2>Projects</h2>

            <div className="resume-item">
              <h3>Gallery Portfolio</h3>
              <p>
                Full-stack portfolio platform using React, Spring Boot, and
                PostgreSQL.
              </p>
            </div>

            <div className="resume-item">
              <h3>Machine Learning Project</h3>
              <p>
                Built classification models, evaluated performance, and produced
                technical analysis reports.
              </p>
            </div>
          </section>

          <section className="resume-section">
            <h2>Education</h2>

            <div className="resume-item">
              <h3>Postgraduate Diploma in Computer Sciences</h3>
              <p>AUT — Machine Learning, Deep Learning, Data Mining</p>
            </div>
          </section>
        </div>

        <aside className="resume-sidebar">
          <section>
            <h2>Skills</h2>
            <div className="skill-list">
              <span>React</span>
              <span>TypeScript</span>
              <span>Java</span>
              <span>Spring Boot</span>
              <span>Python</span>
              <span>PostgreSQL</span>
              <span>UI Design</span>
              <span>Graphic Design</span>
            </div>
          </section>

          <section>
            <h2>Tools</h2>
            <p>VS Code, GitHub, Figma, Adobe Creative Suite, PyCharm</p>
          </section>

          <section>
            <h2>References</h2>
            <p>Available on request.</p>
          </section>
        </aside>
      </section>
    </main>
  );
}

export default ResumePage;
