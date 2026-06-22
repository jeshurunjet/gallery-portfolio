import type { JSONContent } from "@tiptap/react";

export type TextAlignOption = "left" | "center" | "right" | "justify";

export type LegacyProjectContentBlock =
  | { type: "heading"; text: string }
  | { type: "subheading"; text: string }
  | { type: "paragraph"; text: string; align?: TextAlignOption }
  | { type: "quote"; text: string }
  | {
      type: "image";
      url: string;
      alt: string;
      caption?: string;
      publicId?: string;
    }
  | { type: "video"; url: string; caption?: string; publicId?: string }
  | { type: "list"; items: string[] }
  | { type: "divider" }
  | {
      type: "twoColumn";
      left: string;
      right: string;
      align?: TextAlignOption;
    }
  | {
      type: "mediaText";
      layout: "image-left" | "image-right" | "image-text-image" | "image-image";
      mediaType?: "image" | "video";
      text: string;
      imageUrl: string;
      imageAlt?: string;
      imageUrlRight?: string;
      imageAltRight?: string;
      publicId?: string;
      publicIdRight?: string;
      align?: TextAlignOption;
    }
  | {
      type: "references";
      items: { label: string; value: string }[];
    };

const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [],
};

type InlineToken =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "italic"; text: string }
  | { type: "underline"; text: string };

function parseInlineTokens(text: string): InlineToken[] {
  return text
    .split(/(\*\*.*?\*\*|__.*?__|\*.*?\*)/g)
    .filter(Boolean)
    .map((token) => {
      if (token.startsWith("**") && token.endsWith("**")) {
        return { type: "bold", text: token.slice(2, -2) };
      }

      if (token.startsWith("__") && token.endsWith("__")) {
        return { type: "underline", text: token.slice(2, -2) };
      }

      if (token.startsWith("*") && token.endsWith("*")) {
        return { type: "italic", text: token.slice(1, -1) };
      }

      return { type: "text", text: token };
    });
}

function marksForToken(token: InlineToken): JSONContent["marks"] {
  switch (token.type) {
    case "bold":
      return [{ type: "bold" }];
    case "italic":
      return [{ type: "italic" }];
    case "underline":
      return [{ type: "underline" }];
    default:
      return undefined;
  }
}

function richTextNodesFromText(text: string): JSONContent[] {
  return parseInlineTokens(text)
    .filter((token) => token.text.length > 0)
    .map((token) => ({
      type: "text",
      text: token.text,
      marks: marksForToken(token),
    }));
}

function paragraphNode(text: string, align?: TextAlignOption): JSONContent {
  return {
    type: "paragraph",
    attrs: align && align !== "left" ? { textAlign: align } : {},
    content: richTextNodesFromText(text),
  };
}

function paragraphsFromPlainText(
  text: string,
  align?: TextAlignOption
): JSONContent[] {
  const lines = text.split("\n");
  const nodes: JSONContent[] = [];
  let bulletItems: string[] = [];
  let orderedItems: string[] = [];

  const flushBullets = () => {
    if (bulletItems.length === 0) return;
    nodes.push({
      type: "bulletList",
      content: bulletItems.map((item) => ({
        type: "listItem",
        content: [paragraphNode(item)],
      })),
    });
    bulletItems = [];
  };

  const flushOrdered = () => {
    if (orderedItems.length === 0) return;
    nodes.push({
      type: "orderedList",
      content: orderedItems.map((item) => ({
        type: "listItem",
        content: [paragraphNode(item)],
      })),
    });
    orderedItems = [];
  };

  lines.forEach((line) => {
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
      nodes.push({ type: "horizontalRule" });
      return;
    }

    if (trimmed.length === 0) {
      nodes.push(paragraphNode("", align));
      return;
    }

    nodes.push(paragraphNode(trimmed, align));
  });

  flushBullets();
  flushOrdered();

  return nodes;
}

function legacyBlocksToContentNodes(
  blocks: LegacyProjectContentBlock[] | null | undefined
): JSONContent[] {
  if (!blocks?.length) {
    return [];
  }

  return blocks.flatMap((block) => {
    switch (block.type) {
      case "heading":
        return [
          {
            type: "heading",
            attrs: { level: 2 },
            content: richTextNodesFromText(block.text),
          },
        ];
      case "subheading":
        return [
          {
            type: "heading",
            attrs: { level: 3 },
            content: richTextNodesFromText(block.text),
          },
        ];
      case "paragraph":
        return paragraphsFromPlainText(block.text, block.align);
      case "quote":
        return [
          {
            type: "blockquote",
            content: [paragraphNode(block.text)],
          },
        ];
      case "image":
        return [
          {
            type: "image",
            attrs: {
              src: block.url,
              alt: block.alt,
              publicId: block.publicId ?? null,
              caption: block.caption ?? "",
            },
          },
        ];
      case "video":
        return [
          {
            type: "projectVideo",
            attrs: {
              url: block.url,
              publicId: block.publicId ?? null,
              caption: block.caption ?? "",
            },
          },
        ];
      case "list":
        return [
          {
            type: "bulletList",
            content: block.items.map((item) => ({
              type: "listItem",
              content: [paragraphNode(item)],
            })),
          },
        ];
      case "divider":
        return [{ type: "horizontalRule" }];
      case "twoColumn":
        return [
          {
            type: "twoColumn",
            attrs: {
              left: block.left,
              right: block.right,
              align: block.align ?? "left",
            },
          },
        ];
      case "mediaText":
        return [
          {
            type: "mediaText",
            attrs: {
              ...block,
              align: block.align ?? "left",
              mediaType: block.mediaType ?? "image",
            },
          },
        ];
      case "references":
        return [
          {
            type: "references",
            attrs: {
              items: block.items,
            },
          },
        ];
      default:
        return [];
    }
  });
}

function extractDocContent(json: JSONContent | null | undefined): JSONContent[] {
  if (!json || json.type !== "doc" || !Array.isArray(json.content)) {
    return [];
  }

  return json.content;
}

export function legacyBlocksToContentJson(
  blocks: LegacyProjectContentBlock[] | null | undefined
): JSONContent {
  return {
    type: "doc",
    content: legacyBlocksToContentNodes(blocks),
  };
}

export function ensureProjectContentJson(
  contentJson: JSONContent | null | undefined,
  legacyContent?: LegacyProjectContentBlock[] | null,
  legacyDescription?: string | null,
  legacyDescriptionJson?: JSONContent | null
): JSONContent {
  const primaryContent = extractDocContent(contentJson);
  const richDescriptionContent = extractDocContent(legacyDescriptionJson);
  const descriptionContent =
    richDescriptionContent.length > 0
      ? richDescriptionContent
      : legacyDescription?.trim()
        ? paragraphsFromPlainText(legacyDescription)
        : [];
  const fallbackContent = legacyBlocksToContentNodes(legacyContent);

  if (primaryContent.length > 0) {
    return {
      type: "doc",
      content: [...descriptionContent, ...primaryContent],
    };
  }

  if (descriptionContent.length > 0 || fallbackContent.length > 0) {
    return {
      type: "doc",
      content: [...descriptionContent, ...fallbackContent],
    };
  }

  return EMPTY_DOC;
}

function collectPlainText(node: JSONContent | null | undefined): string[] {
  if (!node) return [];

  if (node.type === "text") {
    return node.text?.trim() ? [node.text] : [];
  }

  const childText = (node.content ?? []).flatMap((child) => collectPlainText(child));

  if (node.type === "hardBreak") {
    return ["\n"];
  }

  if (
    node.type === "paragraph" ||
    node.type === "heading" ||
    node.type === "blockquote" ||
    node.type === "listItem"
  ) {
    return [...childText, "\n"];
  }

  if (node.type === "bulletList" || node.type === "orderedList") {
    return [...childText, "\n"];
  }

  return childText;
}

export function contentJsonToPlainText(
  contentJson: JSONContent | null | undefined
): string {
  return collectPlainText(contentJson)
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}
