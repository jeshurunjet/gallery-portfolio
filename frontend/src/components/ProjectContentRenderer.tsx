import type { ProjectContentBlock } from "../data/projects";

type ProjectContentRendererProps = {
  content: ProjectContentBlock[];
};

function ProjectContentRenderer({ content }: ProjectContentRendererProps) {
  return (
    <section className="project-content-blocks">
      {content.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h2 key={index} className="content-heading">
              {block.text}
            </h2>
          );
        }

        if (block.type === "subheading") {
          return (
            <h3 key={index} className="content-subheading">
              {block.text}
            </h3>
          );
        }

        if (block.type === "paragraph") {
          const parts = block.text.split(/(\*\*.*?\*\*)/g);

          return (
            <p key={index} className="content-paragraph">
              {parts.map((part, i) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return <strong key={i}>{part.replace(/\*\*/g, "")}</strong>;
                }
                return part;
              })}
            </p>
          );
        }

        if (block.type === "quote") {
          return (
            <blockquote key={index} className="content-quote">
              {block.text}
            </blockquote>
          );
        }

        if (block.type === "image") {
          return (
            <div key={index} className="content-image-wrap">
              <img src={block.url} alt={block.alt} className="content-image" />
            </div>
          );
        }

        return null;
      })}
    </section>
  );
}

export default ProjectContentRenderer;
