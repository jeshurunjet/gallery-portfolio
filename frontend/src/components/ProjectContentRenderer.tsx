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

        if (block.type === "paragraph") {
          return (
            <p key={index} className="content-paragraph">
              {block.text}
            </p>
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
