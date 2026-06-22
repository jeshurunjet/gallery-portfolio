import type { JSONContent } from "@tiptap/react";

export type DraftMediaType = "image" | "video";

export type DraftMediaItem = {
  file: File;
  previewUrl: string;
  type: DraftMediaType;
};

export type DraftMediaMap = Map<string, DraftMediaItem>;

type UploadResult = {
  url: string;
  publicId: string;
};

type Uploaders = {
  uploadImage: (file: File) => Promise<UploadResult>;
  uploadVideo: (file: File) => Promise<UploadResult>;
};

const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [],
};

export function createDraftMediaItem(file: File, type: DraftMediaType) {
  const tempId = `${type}-${crypto.randomUUID()}`;

  return {
    tempId,
    previewUrl: URL.createObjectURL(file),
    item: {
      file,
      type,
      previewUrl: "",
    } satisfies Omit<DraftMediaItem, "previewUrl"> & { previewUrl: string },
  };
}

function mapDraftNode(
  node: JSONContent,
  transform: (node: JSONContent) => Promise<JSONContent>
): Promise<JSONContent> {
  return transform(node).then(async (nextNode) => {
    if (!nextNode.content?.length) {
      return nextNode;
    }

    const nextContent = await Promise.all(
      nextNode.content.map((child) => mapDraftNode(child, transform))
    );

    return {
      ...nextNode,
      content: nextContent,
    };
  });
}

export function collectDraftMediaIds(content: JSONContent | null | undefined) {
  const ids = new Set<string>();

  const walk = (node: JSONContent | null | undefined) => {
    if (!node) return;

    const tempId = node.attrs?.tempId;

    if (typeof tempId === "string" && tempId.trim()) {
      ids.add(tempId);
    }

    node.content?.forEach((child) => walk(child));
  };

  walk(content);

  return ids;
}

export async function resolveDraftMediaInContent(
  content: JSONContent | null | undefined,
  draftMedia: DraftMediaMap,
  uploaders: Uploaders
) {
  const sourceContent = content?.type === "doc" ? content : EMPTY_DOC;

  return mapDraftNode(sourceContent, async (node) => {
    const tempId = node.attrs?.tempId;

    if (typeof tempId !== "string" || !tempId.trim()) {
      return node;
    }

    const draftItem = draftMedia.get(tempId);

    if (!draftItem) {
      throw new Error("A pending editor upload is missing. Please re-add the media.");
    }

    const result =
      draftItem.type === "video"
        ? await uploaders.uploadVideo(draftItem.file)
        : await uploaders.uploadImage(draftItem.file);

    if (node.type === "image") {
      return {
        ...node,
        attrs: {
          ...node.attrs,
          src: result.url,
          publicId: result.publicId,
          tempId: null,
          uploadStatus: "uploaded",
        },
      };
    }

    if (node.type === "projectVideo") {
      return {
        ...node,
        attrs: {
          ...node.attrs,
          url: result.url,
          publicId: result.publicId,
          tempId: null,
          uploadStatus: "uploaded",
        },
      };
    }

    return node;
  });
}
