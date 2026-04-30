import type { ReactNode } from "react";

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
          {listBuffer.map((item, i) => (
            <li key={i}>{renderInlineText(item)}</li>
          ))}
        </ol>
      );
    } else {
      elements.push(
        <ul className="content-list" key={`list-${elements.length}`}>
          {listBuffer.map((item, i) => (
            <li key={i}>{renderInlineText(item)}</li>
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

    if (trimmed !== "") {
      elements.push(
        <p key={`p-${index}`} className="content-paragraph">
          {renderInlineText(trimmed)}
        </p>
      );
    }
  });

  flushList();

  return elements;
}

function FormattedText({ text }: { text: string }) {
  return <div>{renderTextWithLists(text)}</div>;
}

export default FormattedText;
