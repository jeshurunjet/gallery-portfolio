package com.jeshurun.portfolio.config;

import com.jeshurun.portfolio.entity.PageContent;
import com.jeshurun.portfolio.repository.PageContentRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class PageContentSeeder implements CommandLineRunner {

    private final PageContentRepository pageContentRepository;

    public PageContentSeeder(PageContentRepository pageContentRepository) {
        this.pageContentRepository = pageContentRepository;
    }

    @Override
    public void run(String... args) {
        seed("about", DEFAULT_ABOUT_CONTENT);
        seed("resume", DEFAULT_RESUME_CONTENT);
    }

    private void seed(String pageKey, String content) {
        if (pageContentRepository.findByPageKey(pageKey).isPresent()) {
            return;
        }

        pageContentRepository.save(new PageContent(pageKey, content));
    }

    private static final String DEFAULT_ABOUT_CONTENT = """
            {"heroEyebrow":"About Me","heroTitle":"Full-stack developer with a designer's eye.","heroParagraphs":["I am a web and cloud development professional based in Auckland, New Zealand, with experience across full-stack development, front-end engineering, UI design, graphic design, and digital solutions.","After several years in disability support work, I am transitioning back into IT with a practical mix of technical skill, creative production, and client-facing experience."],"focusTitle":"Current Focus","focusText":"Completing a Level 8 Diploma in Computer Science at AUT while building web projects for businesses, community groups, and my own portfolio.","focusAreas":["Full-stack web development","Front-end engineering","UI and graphic design","Cloud deployment","Digital solutions for small teams"],"statement":"My work sits between design and engineering. I can plan interfaces, create assets, build responsive front ends, connect data, and deploy projects. I also bring a service mindset from support work: clear communication, patience, documentation, and care for the people using the final product.","strengths":[{"title":"Build","icon":"code","text":"React, Next.js, Vite, NodeJS, PHP, Java, Spring Boot, Firebase, PostgreSQL, and deployment workflows."},{"title":"Design","icon":"palette","text":"Visual identity, layouts, icons, sprites, web interfaces, print-ready material, and digital brand assets."},{"title":"Coordinate","icon":"heart","text":"Several years of support work strengthened my communication, planning, documentation, and stakeholder coordination."},{"title":"Launch","icon":"rocket","text":"I enjoy moving ideas from early sketches into working, hosted, usable websites and tools."}],"experienceEyebrow":"Experience","experienceTitle":"Creative, technical, and people-focused work.","experienceText":"I have worked as a web developer, full-stack developer, front-end developer, graphic designer, video-photographer, and support worker. That background gives me a broad view of digital projects: how they look, how they work, how they are maintained, and how they support real people."}
            """;

    private static final String DEFAULT_RESUME_CONTENT = """
            {"cvUrl":"https://docs.google.com/document/d/1s7pvk6pstVVBFssVP_TyNfAvKNwUHkJzdhvS-wtD-48/edit?usp=sharing","eyebrow":"Resume","name":"Jesh Sanchez","summary":"Web and cloud development professional with experience in full-stack development, front-end engineering, UI design, graphic design, and digital solutions.","contactLinks":[{"label":"Auckland, New Zealand","icon":"map"},{"label":"jeshurunjet@gmail.com","href":"mailto:jeshurunjet@gmail.com","icon":"mail"},{"label":"+64 22 457 9004","href":"tel:+64224579004","icon":"phone"},{"label":"GitHub","href":"https://github.com/jeshurunjet","icon":"code"}],"quickCardLabel":"Open full CV","quickCardText":"Currently completing a Level 8 Diploma in Computer Science at AUT.","profile":"After several years in disability support work, I am transitioning back into IT to gain professional experience in web development and software engineering. I bring experience supporting clients, coordinating with healthcare professionals, and delivering web solutions in small teams.","skillGroups":[{"title":"Web","skills":["ReactJS","Next.js","Vite","Redux","Gatsby.js","React Native","NodeJS","TypeScript","HTML5","CSS3","SASS"]},{"title":"Backend & Cloud","skills":["Java","Spring Boot","Spring Security","JWT","PHP","MySQL","PostgreSQL","Firebase","Docker","Cloudinary","Vercel","Render"]},{"title":"Design & Media","skills":["Photoshop","Illustrator","InDesign","Premiere","After Effects","UI Design","Graphic Design"]}],"experience":[{"role":"Web Developer / Graphic Designer","company":"JMB Enterprise NZ Limited","period":"2024 - Present","meta":"Volunteer / Part-Time","points":["Developing websites for three laundromats using Vite, ReactJS, Next.js, and Mantine.","Building a separate website for Grace Abounds NZ.","Created custom sprites, icons, branding assets, and visual interface material.","Integrated Tangerpay QR payment flows for mobile laundry machine payments.","Coordinate directly with owners and stakeholders to plan, design, and implement digital solutions."]},{"role":"Support Worker","company":"Creative Abilities Ltd.","period":"August 2020 - Present","points":["Provided personal care and physical support for clients with physical and intellectual disabilities.","Coordinated appointments and administration with GPs, OT nurses, physiotherapists, foundations, and other stakeholders.","Organised social and community engagement activities for client wellbeing.","Maintained logs and records to improve communication and continuity of support."]},{"role":"Full Stack Developer","company":"Aux. Limited","period":"2019","points":["Developed full-stack web applications using ReactJS and Firebase in a team of 10 developers.","Built responsive UI components and reusable modules.","Collaborated in Agile/Scrum sprints, testing, and debugging workflows."]},{"role":"Front-End Developer / Graphic Designer","company":"RR Donnelley","period":"2017 - 2018","points":["Designed automation tools using JavaScript and PHP.","Produced magazine layouts, brochures, and print-ready corporate materials."]},{"role":"Video-Photographer / Graphic Designer","company":"Azilana Digital Photography","period":"2016 - 2017","points":["Filmed and edited promotional AVPs for FEU campuses using DSLR cameras and professional editing tools."]},{"role":"Web Designer / Graphic Designer","company":"Orange and Bronze Software Development","period":"2014 - 2015","points":["Designed website layouts, ID cards, branding materials, posters, and office murals for corporate clients."]}],"education":[{"title":"Diploma in Computer Science","level":"Level 8","school":"Auckland University of Technology (AUT)","period":"In Progress - Expected February 2027"},{"title":"Diploma in Software Development","level":"Level 7","school":"ATMC - Australian Technical and Management College","period":"2018 - 2019"},{"title":"Bachelor of Arts - Multimedia Arts","level":"Level 7","school":"De La Salle - College of Saint Benilde","period":"2010 - 2015"}],"portfolioLinks":[{"title":"jesh.nz","description":"Main portfolio","href":"https://www.jesh.nz"},{"title":"jeshport.web.app","description":"Alternate portfolio build","href":"https://jeshport.web.app"},{"title":"Behance","description":"Design and visual work","href":"https://www.behance.net/jeshurun"}],"referees":"Available upon request."}
            """;
}
