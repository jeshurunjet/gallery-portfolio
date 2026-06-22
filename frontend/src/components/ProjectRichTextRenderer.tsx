import type { JSONContent } from "@tiptap/react";

type ProjectRichTextRendererProps = {
  content: JSONContent;
  className?: string;
};

function renderInlineNodes(content?: JSONContent[]) {
  return content?.map((node, index) => {
    if (node.type === "text") {
      let value: React.ReactNode = node.text ?? "";

      node.marks?.forEach((mark) => {
        if (mark.type === "bold") {
          value = <strong>{value}</strong>;
        } else if (mark.type === "italic") {
          value = <em>{value}</em>;
        } else if (mark.type === "underline") {
          value = <span className="inline-underline">{value}</span>;
        } else if (mark.type === "link") {
          value = (
            <a href={String(mark.attrs?.href ?? "")} target="_blank" rel="noreferrer">
              {value}
            </a>
          );
        }
      });

      return <span key={index}>{value}</span>;
    }

    if (node.type === "hardBreak") {
      return <br key={index} />;
    }

    return null;
  });
}

function renderPlainText(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let bulletItems: string[] = [];
  let orderedItems: string[] = [];

  const flushBullets = () => {
    if (bulletItems.length === 0) return;
    elements.push(
      <ul className="content-list" key={`bullet-${elements.length}`}>
        {bulletItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    );
    bulletItems = [];
  };

  const flushOrdered = () => {
    if (orderedItems.length === 0) return;
    elements.push(
      <ol className="content-list" key={`ordered-${elements.length}`}>
        {orderedItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ol>
    );
    orderedItems = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("- ")) {
      flushOrdered();
      bulletItems.push(trimmed.slice(2));
      return;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      flushBullets();
      orderedItems.push(trimmed.replace(/^\d+\.\s/, ""));
      return;
    }

    flushBullets();
    flushOrdered();

    if (trimmed === "---") {
      elements.push(<hr key={`divider-${index}`} className="content-divider" />);
      return;
    }

    if (!trimmed) {
      elements.push(<div key={`spacer-${index}`} className="content-spacer" />);
      return;
    }

    elements.push(
      <p key={`paragraph-${index}`} className="content-paragraph">
        {trimmed}
      </p>
    );
  });

  flushBullets();
  flushOrdered();

  return elements;
}

function ProjectRichTextRenderer({
  content,
  className = "",
}: ProjectRichTextRendererProps) {
  return (
    <section className={`project-content-blocks ${className}`.trim()}>
      {content.content?.map((node, index) => {
        if (node.type === "heading") {
          const level = Number(node.attrs?.level ?? 2);
          if (level >= 3) {
            return (
              <h3 key={index} className="content-subheading">
                {renderInlineNodes(node.content)}
              </h3>
            );
          }

          return (
            <h2 key={index} className="content-heading">
              {renderInlineNodes(node.content)}
            </h2>
          );
        }

        if (node.type === "paragraph") {
          const align = String(node.attrs?.textAlign ?? "left");
          return (
            <p key={index} className={`content-paragraph text-${align}`}>
              {renderInlineNodes(node.content)}
            </p>
          );
        }

        if (node.type === "blockquote") {
          return (
            <blockquote key={index} className="content-quote">
              {node.content?.map((child, childIndex) => (
                <p key={childIndex}>{renderInlineNodes(child.content)}</p>
              ))}
            </blockquote>
          );
        }

        if (node.type === "bulletList") {
          return (
            <ul key={index} className="content-list">
              {node.content?.map((item, itemIndex) => (
                <li key={itemIndex}>
                  {item.content?.map((child, childIndex) => (
                    <span key={childIndex}>{renderInlineNodes(child.content)}</span>
                  ))}
                </li>
              ))}
            </ul>
          );
        }

        if (node.type === "orderedList") {
          return (
            <ol key={index} className="content-list">
              {node.content?.map((item, itemIndex) => (
                <li key={itemIndex}>
                  {item.content?.map((child, childIndex) => (
                    <span key={childIndex}>{renderInlineNodes(child.content)}</span>
                  ))}
                </li>
              ))}
            </ol>
          );
        }

        if (node.type === "horizontalRule") {
          return <hr key={index} className="content-divider" />;
        }

        if (node.type === "image") {
          return (
            <div key={index} className="content-image-wrap">
              <img
                src={String(node.attrs?.src ?? "")}
                alt={String(node.attrs?.alt ?? "")}
                className="content-image"
              />
            </div>
          );
        }

        if (node.type === "projectVideo") {
          return (
            <div key={index} className="content-image-wrap">
              <video
                src={String(node.attrs?.url ?? "")}
                className="content-image content-media-video"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                controls
              />
              {node.attrs?.caption ? (
                <p className="content-media-caption">
                  {String(node.attrs.caption)}
                </p>
              ) : null}
            </div>
          );
        }

        if (node.type === "twoColumn") {
          const align = String(node.attrs?.align ?? "left");
          return (
            <div key={index} className="content-two-column">
              <div className={`content-column text-${align}`}>
                {renderPlainText(String(node.attrs?.left ?? ""))}
              </div>
              <div className={`content-column text-${align}`}>
                {renderPlainText(String(node.attrs?.right ?? ""))}
              </div>
            </div>
          );
        }

        if (node.type === "mediaText") {
          const layout = String(node.attrs?.layout ?? "image-left");
          const align = String(node.attrs?.align ?? "left");
          const mediaType = String(node.attrs?.mediaType ?? "image");
          const primaryMedia =
            mediaType === "video" ? (
              <video
                src={String(node.attrs?.imageUrl ?? "")}
                className="content-media-image content-media-video"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                src={String(node.attrs?.imageUrl ?? "")}
                alt={String(node.attrs?.imageAlt ?? "")}
                className="content-media-image"
              />
            );

          if (layout === "image-image") {
            return (
              <div
                key={index}
                className="content-media-text content-media-image-pair"
              >
                {primaryMedia}
                {node.attrs?.imageUrlRight ? (
                  <img
                    src={String(node.attrs.imageUrlRight)}
                    alt={String(node.attrs?.imageAltRight ?? "")}
                    className="content-media-image"
                  />
                ) : null}
              </div>
            );
          }

          if (layout === "image-text-image") {
            return (
              <div
                key={index}
                className="content-media-text content-media-text-three"
              >
                {primaryMedia}
                <div className={`content-media-copy text-${align}`}>
                  {renderPlainText(String(node.attrs?.text ?? ""))}
                </div>
                {node.attrs?.imageUrlRight ? (
                  <img
                    src={String(node.attrs.imageUrlRight)}
                    alt={String(node.attrs?.imageAltRight ?? "")}
                    className="content-media-image"
                  />
                ) : null}
              </div>
            );
          }

          return (
            <div
              key={index}
              className={`content-media-text ${
                layout === "image-right" ? "content-media-reverse" : ""
              }`}
            >
              {primaryMedia}
              <div className={`content-media-copy text-${align}`}>
                {renderPlainText(String(node.attrs?.text ?? ""))}
              </div>
            </div>
          );
        }

        if (node.type === "references") {
          const items = Array.isArray(node.attrs?.items)
            ? (node.attrs.items as { label: string; value: string }[])
            : [];

          return (
            <div key={index} className="content-references">
              <h3 className="content-subheading">References</h3>
              <ul>
                {items.map((item, itemIndex) => (
                  <li key={`${item.label}-${itemIndex}`}>
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

export default ProjectRichTextRenderer;
