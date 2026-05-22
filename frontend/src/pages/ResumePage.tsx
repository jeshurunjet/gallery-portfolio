import { Code2, ExternalLink, Mail, MapPin, Phone } from "lucide-react";

const cvUrl =
  "https://docs.google.com/document/d/1s7pvk6pstVVBFssVP_TyNfAvKNwUHkJzdhvS-wtD-48/edit?usp=sharing";

const contactLinks = [
  {
    label: "Auckland, New Zealand",
    icon: <MapPin size={16} />,
  },
  {
    label: "jeshurunjet@gmail.com",
    href: "mailto:jeshurunjet@gmail.com",
    icon: <Mail size={16} />,
  },
  {
    label: "+64 22 457 9004",
    href: "tel:+64224579004",
    icon: <Phone size={16} />,
  },
  {
    label: "GitHub",
    href: "https://github.com/jeshurunjet",
    icon: <Code2 size={16} />,
  },
];

const skillGroups = [
  {
    title: "Web",
    skills: [
      "ReactJS",
      "Next.js",
      "Vite",
      "Redux",
      "Gatsby.js",
      "React Native",
      "NodeJS",
      "TypeScript",
      "HTML5",
      "CSS3",
      "SASS",
    ],
  },
  {
    title: "Backend & Cloud",
    skills: [
      "Java",
      "Spring Boot",
      "Spring Security",
      "JWT",
      "PHP",
      "MySQL",
      "PostgreSQL",
      "Firebase",
      "Docker",
      "Cloudinary",
      "Vercel",
      "Render",
    ],
  },
  {
    title: "Design & Media",
    skills: [
      "Photoshop",
      "Illustrator",
      "InDesign",
      "Premiere",
      "After Effects",
      "UI Design",
      "Graphic Design",
    ],
  },
];

const experience = [
  {
    role: "Web Developer / Graphic Designer",
    company: "JMB Enterprise NZ Limited",
    period: "2024 - Present",
    meta: "Volunteer / Part-Time",
    points: [
      "Developing websites for three laundromats using Vite, ReactJS, Next.js, and Mantine.",
      "Building a separate website for Grace Abounds NZ.",
      "Created custom sprites, icons, branding assets, and visual interface material.",
      "Integrated Tangerpay QR payment flows for mobile laundry machine payments.",
      "Coordinate directly with owners and stakeholders to plan, design, and implement digital solutions.",
    ],
  },
  {
    role: "Support Worker",
    company: "Creative Abilities Ltd.",
    period: "August 2020 - Present",
    points: [
      "Provided personal care and physical support for clients with physical and intellectual disabilities.",
      "Coordinated appointments and administration with GPs, OT nurses, physiotherapists, foundations, and other stakeholders.",
      "Organised social and community engagement activities for client wellbeing.",
      "Maintained logs and records to improve communication and continuity of support.",
    ],
  },
  {
    role: "Full Stack Developer",
    company: "Aux. Limited",
    period: "2019",
    points: [
      "Developed full-stack web applications using ReactJS and Firebase in a team of 10 developers.",
      "Built responsive UI components and reusable modules.",
      "Collaborated in Agile/Scrum sprints, testing, and debugging workflows.",
    ],
  },
  {
    role: "Front-End Developer / Graphic Designer",
    company: "RR Donnelley",
    period: "2017 - 2018",
    points: [
      "Designed automation tools using JavaScript and PHP.",
      "Produced magazine layouts, brochures, and print-ready corporate materials.",
    ],
  },
  {
    role: "Video-Photographer / Graphic Designer",
    company: "Azilana Digital Photography",
    period: "2016 - 2017",
    points: [
      "Filmed and edited promotional AVPs for FEU campuses using DSLR cameras and professional editing tools.",
    ],
  },
  {
    role: "Web Designer / Graphic Designer",
    company: "Orange and Bronze Software Development",
    period: "2014 - 2015",
    points: [
      "Designed website layouts, ID cards, branding materials, posters, and office murals for corporate clients.",
    ],
  },
];

const education = [
  {
    title: "Diploma in Computer Science",
    level: "Level 8",
    school: "Auckland University of Technology (AUT)",
    period: "In Progress - Expected February 2027",
  },
  {
    title: "Diploma in Software Development",
    level: "Level 7",
    school: "ATMC - Australian Technical and Management College",
    period: "2018 - 2019",
  },
  {
    title: "Bachelor of Arts - Multimedia Arts",
    level: "Level 7",
    school: "De La Salle - College of Saint Benilde",
    period: "2010 - 2015",
  },
];

const portfolioLinks = [
  {
    title: "jesh.nz",
    description: "Main portfolio",
    href: "https://www.jesh.nz",
  },
  {
    title: "jeshport.web.app",
    description: "Alternate portfolio build",
    href: "https://jeshport.web.app",
  },
  {
    title: "Behance",
    description: "Design and visual work",
    href: "https://www.behance.net/jeshurun",
  },
];

function ResumePage() {
  return (
    <main className="resume-page">
      <section className="resume-header resume-header-featured">
        <div>
          <p className="eyebrow">Resume</p>
          <h1>Jesh Sanchez</h1>
          <p>
            Web and cloud development professional with experience in full-stack
            development, front-end engineering, UI design, graphic design, and
            digital solutions.
          </p>

          <div className="resume-contact-row">
            {contactLinks.map((item) =>
              item.href ? (
                <a key={item.label} href={item.href}>
                  {item.icon}
                  {item.label}
                </a>
              ) : (
                <span key={item.label}>
                  {item.icon}
                  {item.label}
                </span>
              )
            )}
          </div>
        </div>

        <div className="resume-quick-card">
          <span>Open full CV</span>
          <a
            href={cvUrl}
            className="resume-download"
            target="_blank"
            rel="noreferrer"
          >
            View CV <ExternalLink size={16} />
          </a>
          <p>
            Currently completing a Level 8 Diploma in Computer Science at AUT.
          </p>
        </div>
      </section>

      <section className="resume-layout">
        <div className="resume-main">
          <section className="resume-section resume-profile-section">
            <h2>Profile</h2>
            <p>
              After several years in disability support work, I am transitioning
              back into IT to gain professional experience in web development
              and software engineering. I bring experience supporting clients,
              coordinating with healthcare professionals, and delivering web
              solutions in small teams.
            </p>
          </section>

          <section className="resume-section">
            <h2>Professional Experience</h2>
            {experience.map((item) => (
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
              {skillGroups.map((group) => (
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
            {education.map((item) => (
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
              {portfolioLinks.map((item) => (
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
            <p>Available upon request.</p>
          </section>
        </aside>
      </section>
    </main>
  );
}

export default ResumePage;
