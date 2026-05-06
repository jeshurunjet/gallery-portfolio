import type { ReactNode } from "react";
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

function renderTextWithLists(text: string): ReactNode[] {
  const lines = text.split("\n");
  const elements: ReactNode[] = [];

  let listBuffer: string[] = [];
  let listType: "bullet" | "numbered" | null = null;

  const flushList = () => {
    if (listBuffer.length === 0 || listType === null) return;

    if (listType === "numbered") {
      elements.push(
        <ol className="content-list" key={`list-${elements.length}`}>
          {listBuffer.map((item, index) => (
            <li key={index}>{renderInlineText(item)}</li>
          ))}
        </ol>
      );
    } else {
      elements.push(
        <ul className="content-list" key={`list-${elements.length}`}>
          {listBuffer.map((item, index) => (
            <li key={index}>{renderInlineText(item)}</li>
          ))}
        </ul>
      );
    }

    listBuffer = [];
    listType = null;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("- ")) {
      if (listType !== "bullet") {
        flushList();
        listType = "bullet";
      }

      listBuffer.push(trimmed.slice(2));
      return;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      if (listType !== "numbered") {
        flushList();
        listType = "numbered";
      }

      listBuffer.push(trimmed.replace(/^\d+\.\s/, ""));
      return;
    }

    if (trimmed === "---") {
      flushList();
      elements.push(
        <hr key={`divider-${index}`} className="content-divider" />
      );
      return;
    }

    flushList();

    if (trimmed === "") {
      // 👇 this creates spacing between paragraphs
      elements.push(
        <div key={`spacer-${index}`} style={{ height: "0.8rem" }} />
      );
      return;
    }

    elements.push(
      <p key={`paragraph-${index}`} className="content-paragraph">
        {renderInlineText(trimmed)}
      </p>
    );
  });

  flushList();

  return elements;
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
          return <div key={index}>{renderTextWithLists(block.text)}</div>;
        }

        if (block.type === "quote") {
          return (
            <blockquote key={index} className="content-quote">
              {renderInlineText(block.text)}
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
