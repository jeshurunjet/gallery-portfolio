import type { ProjectContentBlock } from "../data/projects";

type ProjectContentRendererProps = {
  content: ProjectContentBlock[];
};

function renderInlineText(text: string) {
  const tokens = text.split(/(\*\*.*?\*\*|__.*?__|\*.*?\*)/g);

  return tokens.map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return <strong key={index}>{token.slice(2, -2)}</strong>;
    }

    if (token.startsWith("__") && token.endsWith("__")) {
      return (
        <span key={index} className="inline-underline">
          {token.slice(2, -2)}
        </span>
      );
    }

    if (token.startsWith("*") && token.endsWith("*")) {
      return <em key={index}>{token.slice(1, -1)}</em>;
    }

    return token;
  });
}

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
          return (
            <p key={index} className="content-paragraph">
              {renderInlineText(block.text)}
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

        if (block.type === "list") {
          return (
            <ul key={index} className="content-list">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInlineText(item)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "divider") {
          return <hr key={index} className="content-divider" />;
        }

        if (block.type === "references") {
          return (
            <div key={index} className="content-references">
              <h3 className="content-subheading">References</h3>
              <ul>
                {block.items.map((item, i) => (
                  <li key={i}>
                    <strong>{item.label}:</strong> {item.value}
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        return null;
      })}
    </section>
  );
}

export default ProjectContentRenderer;
