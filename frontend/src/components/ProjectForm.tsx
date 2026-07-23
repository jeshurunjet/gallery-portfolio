import { useEffect, useRef, useState } from "react";
import type { JSONContent } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  AudioLines,
  Blocks,
  Clapperboard,
  Code2,
  Settings2,
  Images,
  FileText,
  Image as ImageIcon,
  Link2,
  Plus,
  Pin,
  Save,
  PanelLeft,
  PanelRight,
  PanelsLeftRight,
  ChevronDown,
  ChevronRight,
  Trash2,
  Upload,
} from "lucide-react";
import { API_BASE_URL } from "../config";
import type {
  GalleryImage,
  GalleryImagePreset,
  MediaAsset,
} from "../data/projects";
import { DndContext, closestCenter } from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import type { DragEndEvent } from "@dnd-kit/core";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import ProjectTiptapEditor from "./ProjectTiptapEditor";
import {
  ensureProjectContentJson,
  type LegacyProjectContentBlock,
  type TextAlignOption,
} from "../utils/projectContentMigration";
import {
  collectDraftMediaIds,
  resolveDraftMediaInContent,
  type DraftMediaMap,
  type DraftMediaType,
} from "../utils/projectTiptapDraftMedia";

type ProjectFormData = {
  title: string;
  category: string;
  content: LegacyProjectContentBlock[];
  contentJson?: JSONContent | null;
  tags: string;
  cover: string;
  coverPublicId?: string;
  galleryImages: GalleryImage[];
  galleryShowThumbnails: boolean;
  galleryAutoScroll: boolean;
  videos: MediaAsset[];
  audios: MediaAsset[];
  pdfs: MediaAsset[];
  codeContent: string;
  pinned: boolean;
  liveUrl: string;
  githubUrl: string;
  externalUrl: string;
};

type ProjectFormProps = {
  initialData: ProjectFormData;
  submitLabel: string;
  onSubmit: (data: ProjectFormData) => void;
  onNotify?: (message: string) => void;
  pinnedOverride?: boolean;
  onPinnedChange?: (pinned: boolean) => void;
  headerActions?: React.ReactNode;
};

type BlockType =
  | "paragraph"
  | "image"
  | "video"
  | "quote"
  | "divider"
  | "twoColumn"
  | "mediaText";

type MediaTextLayout =
  | "image-left"
  | "image-right"
  | "image-text-image"
  | "image-image";

type UploadResult = {
  url: string;
  publicId: string;
  storage?: "cloudinary" | "local";
};

type MediaCategory = "video" | "audio" | "pdf";

type SortableItemProps = {
  id: string;
  children: React.ReactNode;
};

function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
    width: "100%",
    height: isDragging ? "auto" : undefined,
    flexShrink: 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="sortable-card"
      data-dragging={isDragging ? "true" : "false"}
    >
      <div className="drag-handle" {...attributes} {...listeners}>
        <GripVertical size={20} />
      </div>

      {children}
    </div>
  );
}

function ProjectForm({
  initialData,
  submitLabel,
  onSubmit,
  onNotify,
  pinnedOverride,
  onPinnedChange,
  headerActions,
}: ProjectFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>(() => ({
    ...initialData,
    contentJson: ensureProjectContentJson(initialData.contentJson),
  }));
  const pinnedValue = pinnedOverride ?? formData.pinned;
  const [collapsedBlocks, setCollapsedBlocks] = useState<number[]>(
    initialData.content?.map((_, index) => index) ?? []
  );
  const [pendingDeleteBlockIndex, setPendingDeleteBlockIndex] = useState<
    number | null
  >(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<() => Promise<void>>(
    async () => {}
  );
  const [pendingUploads, setPendingUploads] = useState(0);
  const [newGalleryUrl, setNewGalleryUrl] = useState("");
  const [openGalleryEditorIndex, setOpenGalleryEditorIndex] = useState<
    number | null
  >(null);
  const mediaFileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingRichTextMediaRef = useRef<DraftMediaMap>(new Map());
  const [isMediaDropActive, setIsMediaDropActive] = useState(false);
  const [isMediaLinksOpen, setIsMediaLinksOpen] = useState(false);
  const [mediaLinkDrafts, setMediaLinkDrafts] = useState<
    Record<MediaCategory, string>
  >({
    video: "",
    audio: "",
    pdf: "",
  });
  const toggleBlockCollapse = (index: number) => {
    setCollapsedBlocks((prev) =>
      prev.includes(index)
        ? prev.filter((item) => item !== index)
        : [...prev, index]
    );
  };
  const [collapsedSections, setCollapsedSections] = useState<string[]>([
    "gallery",
    "media",
    "code",
    "links",
    "content",
  ]);
  const toggleSectionCollapse = (section: string) => {
    setCollapsedSections((prev) =>
      prev.includes(section)
        ? prev.filter((item) => item !== section)
        : [...prev, section]
    );
  };
  const hasPendingUploads = pendingUploads > 0;

  useEffect(() => {
    const activeDraftIds = collectDraftMediaIds(formData.contentJson);

    pendingRichTextMediaRef.current.forEach((item, tempId) => {
      if (activeDraftIds.has(tempId)) return;

      URL.revokeObjectURL(item.previewUrl);
      pendingRichTextMediaRef.current.delete(tempId);
    });
  }, [formData.contentJson]);

  useEffect(() => {
    const pendingRichTextMedia = pendingRichTextMediaRef.current;

    return () => {
      pendingRichTextMedia.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
      });
      pendingRichTextMedia.clear();
    };
  }, []);

  const updateGalleryImage = (
    index: number,
    updater: (image: GalleryImage) => GalleryImage
  ) => {
    setFormData((prev) => ({
      ...prev,
      galleryImages: prev.galleryImages.map((image, itemIndex) =>
        itemIndex === index ? updater(image) : image
      ),
    }));
  };

  const getGalleryMaskPreviewStyle = (image: GalleryImage) => {
    if ((image.mode ?? "landscape") === "original") {
      return {
        width: "100%",
        height: "100%",
        objectFit: "contain",
        left: "0",
        top: "0",
        transform: "none",
      } as const;
    }

    return {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: "50% 50%",
      left: "0",
      top: "0",
      transform: "none",
    } as const;
  };

  const getGalleryFrameAspectRatio = (image: GalleryImage) => {
    switch (image.mode ?? "landscape") {
      case "header":
        return "16 / 5";
      case "portrait":
        return "4 / 5";
      case "square":
        return "1 / 1";
      case "original":
        return "4 / 3";
      default:
        return "16 / 9";
    }
  };

  const runWithUploadLock = async <T,>(task: () => Promise<T>) => {
    setPendingUploads((prev) => prev + 1);

    try {
      return await task();
    } finally {
      setPendingUploads((prev) => Math.max(0, prev - 1));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setFormData((prev) => {
      const oldIndex = prev.content.findIndex(
        (_, i) => i.toString() === active.id
      );

      const newIndex = prev.content.findIndex(
        (_, i) => i.toString() === over.id
      );

      return {
        ...prev,
        content: arrayMove(prev.content, oldIndex, newIndex),
      };
    });
  };

  const addContentBlock = (type: BlockType) => {
    let block: LegacyProjectContentBlock;

    switch (type) {
      case "paragraph":
        block = {
          type: "paragraph",
          text: "",
          align: "left",
        };
        break;

      case "image":
        block = {
          type: "image",
          url: "",
          alt: "",
        };
        break;

      case "video":
        block = {
          type: "video",
          url: "",
          caption: "",
        };
        break;

      case "quote":
        block = {
          type: "quote",
          text: "",
        };
        break;

      case "twoColumn":
        block = {
          type: "twoColumn",
          left: "",
          right: "",
          align: "left",
        };
        break;

      case "mediaText":
        block = {
          type: "mediaText",
          layout: "image-left",
          mediaType: "image",
          imageUrl: "",
          imageAlt: "",
          imageUrlRight: "",
          imageAltRight: "",
          text: "",
          align: "left",
        };
        break;

      default:
        block = {
          type: "divider",
        };
    }

    setFormData((prev) => ({
      ...prev,
      content: [...(prev.content ?? []), block],
    }));
  };

  const updateContentBlock = (
    index: number,
    updatedBlock: LegacyProjectContentBlock
  ) => {
    setFormData((prev) => {
      const updated = [...prev.content];
      updated[index] = updatedBlock;

      return {
        ...prev,
        content: updated,
      };
    });
  };

  const patchContentBlock = (
    index: number,
    updater: (block: LegacyProjectContentBlock) => LegacyProjectContentBlock
  ) => {
    setFormData((prev) => {
      const existingBlock = prev.content[index];

      if (!existingBlock) {
        return prev;
      }

      const updated = [...prev.content];
      updated[index] = updater(existingBlock);

      return {
        ...prev,
        content: updated,
      };
    });
  };

  const duplicateContentBlock = (index: number) => {
    setFormData((prev) => {
      const blockToCopy = prev.content[index];

      if (!blockToCopy) return prev;

      const duplicatedBlock = structuredClone(blockToCopy);

      const updated = [...prev.content];
      updated.splice(index + 1, 0, duplicatedBlock);

      return {
        ...prev,
        content: updated,
      };
    });

    setCollapsedBlocks((prev) => {
      const updated = prev.map((item) => (item > index ? item + 1 : item));
      return [...new Set([...updated, index + 1])];
    });
    setPendingDeleteBlockIndex(null);
    onNotify?.("Content block duplicated.");
  };

  const deleteBlockAssets = async (block: LegacyProjectContentBlock) => {
    if (block.type === "image" && (block.url || block.publicId)) {
      await deleteMedia({
        url: block.url,
        publicId: block.publicId,
        resourceType: "image",
      });
      return;
    }

    if (block.type === "video" && (block.url || block.publicId)) {
      await deleteMedia({
        url: block.url,
        publicId: block.publicId,
        resourceType: "video",
      });
      return;
    }

    if (block.type === "mediaText") {
      if (block.imageUrl || block.publicId) {
        await deleteMedia({
          url: block.imageUrl,
          publicId: block.publicId,
          resourceType: block.mediaType === "video" ? "video" : "image",
        });
      }

      if (block.imageUrlRight || block.publicIdRight) {
        await deleteMedia({
          url: block.imageUrlRight,
          publicId: block.publicIdRight,
          resourceType: "image",
        });
      }
    }
  };

  const deleteContentBlock = async (index: number) => {
    const blockToDelete = formData.content[index];

    if (blockToDelete) {
      try {
        await deleteBlockAssets(blockToDelete);
      } catch (error) {
        console.error("Failed to clean up block assets:", error);
      }
    }

    setFormData((prev) => ({
      ...prev,
      content: prev.content.filter((_, itemIndex) => itemIndex !== index),
    }));

    setCollapsedBlocks((prev) =>
      prev
        .filter((item) => item !== index)
        .map((item) => (item > index ? item - 1 : item))
    );
    setPendingDeleteBlockIndex(null);
    onNotify?.("Content block deleted.");
  };

  const uploadImage = async (file: File): Promise<UploadResult> => {
    return runWithUploadLock(async () => {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch(`${API_BASE_URL}/api/upload/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formDataUpload,
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("isAuth");

        sessionStorage.setItem(
          "authMessage",
          "Your session has expired. Please log in again."
        );

        window.location.replace("/admin/login");

        throw new Error("Session expired");
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Upload failed");
      }

      const data = await response.json();
      return {
        url: data.url as string,
        publicId: data.public_id as string,
        storage: data.storage as "cloudinary" | "local" | undefined,
      };
    });
  };

  const uploadVideo = async (file: File): Promise<UploadResult> => {
    return runWithUploadLock(async () => {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch(`${API_BASE_URL}/api/upload/video`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formDataUpload,
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("isAuth");

        sessionStorage.setItem(
          "authMessage",
          "Your session has expired. Please log in again."
        );

        window.location.replace("/admin/login");

        throw new Error("Session expired");
      }

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      return {
        url: data.url as string,
        publicId: data.public_id as string,
        storage: data.storage as "cloudinary" | "local" | undefined,
      };
    });
  };

  const uploadPdf = async (file: File): Promise<UploadResult> => {
    return runWithUploadLock(async () => {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch(`${API_BASE_URL}/api/upload/pdf`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formDataUpload,
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("isAuth");

        sessionStorage.setItem(
          "authMessage",
          "Your session has expired. Please log in again."
        );

        window.location.replace("/admin/login");

        throw new Error("Session expired");
      }

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      return { url: data.url as string, publicId: data.public_id as string };
    });
  };

  const deleteMedia = async ({
    url,
    publicId,
    resourceType,
  }: {
    url?: string;
    publicId?: string;
    resourceType?: "image" | "video";
  }) => {
    if (!url && !publicId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ url, publicId, resourceType }),
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("isAuth");

        sessionStorage.setItem(
          "authMessage",
          "Your session has expired. Please log in again."
        );

        window.location.replace("/admin/login");
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to delete media:", errorText);
      }
    } catch (err) {
      console.error("Failed to delete media:", err);
    }
  };

  const uploadContentImage = async (
    file: File,
    onSuccess: (imageUrl: string) => void,
    loadingMessage = "Uploading content image...",
    successMessage = "Content image uploaded!",
    errorMessage = "Content image upload failed."
  ): Promise<UploadResult | undefined> => {
    try {
      onNotify?.(loadingMessage);

      const result = await uploadImage(file);

      onSuccess(result.url);

      return result;

      onNotify?.(successMessage);
    } catch (error) {
      console.error(error);
      onNotify?.(errorMessage);
    }
  };

  const uploadContentMedia = async (
    file: File,
    mediaType: "image" | "video",
    onSuccess: (mediaUrl: string) => void
  ): Promise<UploadResult | undefined> => {
    const isVideo = mediaType === "video";

    try {
      onNotify?.(
        isVideo ? "Uploading media video..." : "Uploading media image..."
      );

      const result = isVideo
        ? await uploadVideo(file)
        : await uploadImage(file);

      onSuccess(result.url);

      onNotify?.(isVideo ? "Media video uploaded!" : "Media image uploaded!");

      return result;
    } catch (error) {
      console.error(error);
      onNotify?.(
        isVideo ? "Media video upload failed." : "Media image upload failed."
      );
    }
  };

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { id, value } = event.target;

    if (id === "videoUrl" || id === "audioUrl" || id === "pdfUrl") {
      const category = id.replace("Url", "") as MediaCategory;
      setMediaLinkDrafts((prev) => ({ ...prev, [category]: value }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleRichTextContentChange = (contentJson: JSONContent) => {
    setFormData((prev) => ({
      ...prev,
      contentJson,
    }));
  };

  const stageRichTextMedia = (file: File, type: DraftMediaType) => {
    const tempId = `${type}-${crypto.randomUUID()}`;
    const previewUrl = URL.createObjectURL(file);

    pendingRichTextMediaRef.current.set(tempId, {
      file,
      previewUrl,
      type,
    });

    return { tempId, previewUrl };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (hasPendingUploads) {
      onNotify?.("Please wait for uploads to finish before saving.");
      return;
    }

    const nextContentJson = ensureProjectContentJson(formData.contentJson);
    let nextContentJsonResolved = nextContentJson;

    try {
      if (pendingRichTextMediaRef.current.size > 0) {
        onNotify?.("Uploading editor media before saving...");
        nextContentJsonResolved = await resolveDraftMediaInContent(
          nextContentJson,
          pendingRichTextMediaRef.current,
          {
            uploadImage,
            uploadVideo,
          }
        );
      }
    } catch (error) {
      console.error(error);
      onNotify?.(
        error instanceof Error
          ? error.message
          : "Editor media upload failed. Please try again."
      );
      return;
    }

    onSubmit({
      ...formData,
      pinned: pinnedValue,
      contentJson: nextContentJsonResolved,
    });

    pendingRichTextMediaRef.current.forEach((item) => {
      URL.revokeObjectURL(item.previewUrl);
    });
    pendingRichTextMediaRef.current.clear();
  };

  // Render confirm modal
  const renderConfirmModal = () => {
    if (!confirmOpen) return null;

    return (
      <ConfirmModal
        message={confirmMessage}
        onConfirm={async () => {
          setConfirmOpen(false);
          try {
            await confirmAction();
          } catch (err) {
            console.error(err);
            onNotify?.("Delete failed");
          }
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    );
  };

  const getBlockPreview = (block: LegacyProjectContentBlock, index: number) => {
    switch (block.type) {
      case "paragraph":
        return {
          label: "Paragraph",
          text: block.text?.slice(0, 40) || "Empty",
        };

      case "quote":
        return {
          label: "Quote",
          text: `"${block.text?.slice(0, 30) || "Empty"}..."`,
        };

      case "image":
        return {
          label: "Image",
          text: "Image block",
        };

      case "video":
        return {
          label: "Video",
          text: "Video block",
        };

      case "twoColumn":
        return {
          label: "Two Column",
          text: "Layout",
        };

      case "mediaText":
        switch (block.layout) {
          case "image-left":
            return {
              label: "Image + Text",
              text: "",
            };

          case "image-right":
            return {
              label: "Text + Image",
              text: "",
            };

          case "image-text-image":
            return {
              label: "Image + Text + Image",
              text: "",
            };

          case "image-image":
            return {
              label: "Image + Image",
              text: "",
            };

          default:
            return {
              label: "Media",
              text: "",
            };
        }

      default:
        return {
          label: `Block ${index + 1}`,
          text: "",
        };
    }
  };

  const getGalleryCount = () =>
    formData.galleryImages.filter((image) => image.url.trim()).length;

  const getMediaStatus = () => {
    const mediaIcons = [
      formData.videos.length > 0 ? (
        <Clapperboard key="video" size={15} />
      ) : null,
      formData.audios.length > 0 ? <AudioLines key="audio" size={15} /> : null,
      formData.pdfs.length > 0 ? <FileText key="pdf" size={15} /> : null,
    ].filter(Boolean);

    return mediaIcons.length > 0 ? (
      <span className="admin-section-status-icons">{mediaIcons}</span>
    ) : (
      "Empty"
    );
  };

  const getFileCategory = (file: File): "video" | "audio" | "pdf" | null => {
    const lowerName = file.name.toLowerCase();

    if (file.type.startsWith("video/")) {
      return "video";
    }

    if (file.type.startsWith("audio/")) {
      return "audio";
    }

    if (file.type === "application/pdf" || lowerName.endsWith(".pdf")) {
      return "pdf";
    }

    return null;
  };

  const getMediaItems = (category: MediaCategory) => {
    if (category === "video") return formData.videos;
    if (category === "audio") return formData.audios;
    return formData.pdfs;
  };

  const isManagedMediaItem = (item: MediaAsset) =>
    Boolean(item.publicId) ||
    item.url.includes("/uploads/") ||
    item.url.includes("res.cloudinary.com");

  const appendMediaItem = (category: MediaCategory, item: MediaAsset) => {
    setFormData((prev) => {
      if (category === "video") {
        return { ...prev, videos: [...prev.videos, item] };
      }

      if (category === "audio") {
        return { ...prev, audios: [...prev.audios, item] };
      }

      return { ...prev, pdfs: [...prev.pdfs, item] };
    });
  };

  const removeMediaItem = async (category: MediaCategory, index: number) => {
    const item = getMediaItems(category)[index];

    if (!item) return;

    const resourceType = category === "pdf" ? "image" : "video";

    if (isManagedMediaItem(item)) {
      await deleteMedia({
        url: item.url,
        publicId: item.publicId,
        resourceType,
      });
    }

    setFormData((prev) => {
      if (category === "video") {
        return {
          ...prev,
          videos: prev.videos.filter((_, itemIndex) => itemIndex !== index),
        };
      }

      if (category === "audio") {
        return {
          ...prev,
          audios: prev.audios.filter((_, itemIndex) => itemIndex !== index),
        };
      }

      return {
        ...prev,
        pdfs: prev.pdfs.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  };

  const addMediaLink = (category: MediaCategory) => {
    const nextUrl = mediaLinkDrafts[category].trim();

    if (!nextUrl) {
      onNotify?.("Enter a URL first.");
      return;
    }

    appendMediaItem(category, { url: nextUrl });
    setMediaLinkDrafts((prev) => ({ ...prev, [category]: "" }));
    onNotify?.(
      `${category === "pdf" ? "PDF" : category === "audio" ? "Audio" : "Video"} link added.`
    );
  };

  const getMediaPreviewMeta = (url: string) => {
    try {
      const parsed = new URL(url);
      const segments = parsed.pathname.split("/").filter(Boolean);
      const lastSegment = segments.at(-1);

      return {
        title: lastSegment || parsed.hostname,
        subtitle: parsed.hostname.replace(/^www\./, ""),
      };
    } catch {
      const cleaned = url.replace(/^https?:\/\//, "");
      const [host, ...rest] = cleaned.split("/");

      return {
        title: rest.at(-1) || host || url,
        subtitle: host || "Custom URL",
      };
    }
  };

  const getVideoEmbedUrl = (url: string) => {
    try {
      const parsedUrl = new URL(url);

      if (parsedUrl.hostname.includes("youtube.com")) {
        const videoId = parsedUrl.searchParams.get("v");

        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }

      if (parsedUrl.hostname.includes("youtu.be")) {
        const videoId = parsedUrl.pathname.slice(1);

        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }

      if (parsedUrl.hostname.includes("vimeo.com")) {
        const videoId = parsedUrl.pathname.split("/").filter(Boolean)[0];

        if (videoId) {
          return `https://player.vimeo.com/video/${videoId}`;
        }
      }

      return null;
    } catch {
      return null;
    }
  };

  const isDirectMediaFile = (url: string, extensions: string[]) => {
    const lower = url.toLowerCase();
    return extensions.some((extension) => lower.includes(extension));
  };

  const getSoundCloudEmbedUrl = (url: string) =>
    `https://w.soundcloud.com/player/?url=${encodeURIComponent(
      url
    )}&color=%23111111&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false`;

  const renderMediaPreviewSurface = (
    category: MediaCategory,
    item: MediaAsset
  ) => {
    if (category === "video") {
      const embedUrl = getVideoEmbedUrl(item.url);

      if (embedUrl) {
        return (
          <iframe
            src={embedUrl}
            title="Video preview"
            className="media-dropzone-preview-frame"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      }

      if (
        isDirectMediaFile(item.url, [".mp4", ".webm", ".ogg", ".mov"]) ||
        item.url.includes("/video/upload/") ||
        item.url.includes("/uploads/local_video_")
      ) {
        return (
          <video
            src={item.url}
            className="media-dropzone-preview-video"
            controls
            muted
            playsInline
          />
        );
      }
    }

    if (category === "audio") {
      if (item.url.includes("soundcloud")) {
        return (
          <iframe
            src={getSoundCloudEmbedUrl(item.url)}
            title="Audio preview"
            className="media-dropzone-preview-audio-frame"
            allow="autoplay"
          />
        );
      }

      if (
        isDirectMediaFile(item.url, [".mp3", ".wav", ".m4a", ".ogg"]) ||
        item.url.includes("/video/upload/") ||
        item.url.includes("/uploads/local_video_")
      ) {
        return (
          <div className="media-dropzone-preview-audio-shell">
            <AudioLines size={22} />
            <audio
              src={item.url}
              controls
              className="media-dropzone-preview-audio"
            />
          </div>
        );
      }
    }

    if (category === "pdf") {
      return (
        <object
          data={item.url}
          type="application/pdf"
          className="media-dropzone-preview-pdf"
          aria-label="PDF preview"
        />
      );
    }

    const meta = getMediaPreviewMeta(item.url);

    return (
      <div className="media-dropzone-preview-fallback">
        <strong>{meta.title}</strong>
        <small>{meta.subtitle}</small>
      </div>
    );
  };

  const uploadMediaFiles = async (files: FileList | File[]) => {
    const pendingFiles = Array.from(files);

    if (pendingFiles.length === 0) {
      return;
    }

    for (const file of pendingFiles) {
      const category = getFileCategory(file);

      if (!category) {
        onNotify?.(
          `${file.name} is not supported. Upload video, audio, or PDF files only.`
        );
        continue;
      }

      try {
        if (category === "video") {
          onNotify?.(`Uploading ${file.name}...`);
          const result = await uploadVideo(file);
          appendMediaItem("video", {
            url: result.url,
            publicId: result.publicId,
          });
          onNotify?.("Video uploaded!");
          continue;
        }

        if (category === "audio") {
          onNotify?.(`Uploading ${file.name}...`);
          const result = await uploadVideo(file);
          appendMediaItem("audio", {
            url: result.url,
            publicId: result.publicId,
          });
          onNotify?.("Audio uploaded!");
          continue;
        }

        onNotify?.(`Uploading ${file.name}...`);
        const result = await uploadPdf(file);
        appendMediaItem("pdf", {
          url: result.url,
          publicId: result.publicId,
        });
        onNotify?.(
          result.storage === "local"
            ? "PDF uploaded locally. Cloudinary is not configured in this environment."
            : "PDF uploaded!"
        );
      } catch (error) {
        console.error("Upload failed", error);
        onNotify?.(
          error instanceof Error
            ? error.message
            : `${file.name} upload failed. Please try again.`
        );
      }
    }
  };

  const getLinksStatus = () => {
    const linkCount = [
      formData.liveUrl,
      formData.githubUrl,
      formData.externalUrl,
    ].filter(Boolean).length;

    return linkCount > 0
      ? `${linkCount} link${linkCount === 1 ? "" : "s"}`
      : "Empty";
  };

  const renderSectionHeader = (
    section: string,
    icon: React.ReactNode,
    title: string,
    description: string,
    status?: React.ReactNode
  ) => {
    const isCollapsed = collapsedSections.includes(section);

    return (
      <button
        type="button"
        className="admin-section-toggle"
        onClick={() => toggleSectionCollapse(section)}
      >
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
        <span className="admin-section-icon">{icon}</span>

        <span className="admin-section-toggle-copy">
          <strong>{title}</strong>
          <small>{description}</small>
        </span>

        {status && <span className="admin-section-status">{status}</span>}
      </button>
    );
  };

  const renderAlignmentButtons = (
    currentAlign: TextAlignOption | undefined,
    onChange: (align: TextAlignOption) => void
  ) => {
    const options: {
      value: TextAlignOption;
      label: string;
      icon: React.ReactNode;
    }[] = [
      { value: "left", label: "Left align", icon: <AlignLeft size={18} /> },
      {
        value: "center",
        label: "Center align",
        icon: <AlignCenter size={18} />,
      },
      { value: "right", label: "Right align", icon: <AlignRight size={18} /> },
      {
        value: "justify",
        label: "Justify",
        icon: <AlignJustify size={18} />,
      },
    ];

    return (
      <div className="editor-toggle-group" aria-label="Text alignment">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            title={option.label}
            className={`editor-toggle-button ${
              (currentAlign ?? "left") === option.value ? "active" : ""
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.icon}
          </button>
        ))}
      </div>
    );
  };

  const renderMediaLayoutButtons = (
    currentLayout: string,
    onChange: (layout: MediaTextLayout) => void
  ) => {
    const options: {
      value: MediaTextLayout;
      label: string;
      icon: React.ReactNode;
    }[] = [
      {
        value: "image-left",
        label: "Image left + text right",
        icon: <PanelLeft size={18} />,
      },
      {
        value: "image-right",
        label: "Text left + image right",
        icon: <PanelRight size={18} />,
      },
      {
        value: "image-text-image",
        label: "Image + text + image",
        icon: <PanelsLeftRight size={18} />,
      },
      {
        value: "image-image",
        label: "Image + image",
        icon: <Images size={18} />,
      },
    ];

    return (
      <div className="editor-toggle-group" aria-label="Media layout">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            title={option.label}
            className={`editor-toggle-button ${
              currentLayout === option.value ? "active" : ""
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.icon}
          </button>
        ))}
      </div>
    );
  };

  const renderCoverSection = () => (
    <>
      {renderSectionHeader(
        "cover",
        <ImageIcon size={18} />,
        "Cover Image",
        "Main image used for project cards and page headers.",
        formData.cover ? "Added" : "Empty"
      )}

      {!collapsedSections.includes("cover") && (
        <div className="admin-form-group">
          <label htmlFor="cover">Cover Image URL</label>
          <input
            id="cover"
            type="text"
            placeholder="https://example.com/image.jpg"
            value={formData.cover}
            onChange={handleChange}
          />

          <input
            type="file"
            accept="image/*"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;

              try {
                onNotify?.("Uploading cover image...");
                const result = await uploadImage(file);

                setFormData((prev) => ({
                  ...prev,
                  cover: result.url,
                  coverPublicId: result.publicId,
                }));

                onNotify?.("Cover image uploaded!");
              } catch (error) {
                console.error("Upload failed", error);
                onNotify?.("Cover upload failed. Please try again.");
              }
            }}
          />

          {formData.cover && (
            <div className="upload-preview">
              <img src={formData.cover} alt="Cover preview" />

              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    cover: "",
                    coverPublicId: undefined,
                  }))
                }
              >
                Remove cover
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );

  const renderGallerySection = () => (
    <>
      {renderSectionHeader(
        "gallery",
        <Images size={18} />,
        "Gallery Images",
        "Optional extra images for the project page.",
        getGalleryCount() > 0
          ? `${getGalleryCount()} image${getGalleryCount() === 1 ? "" : "s"}`
          : "Empty"
      )}
      {!collapsedSections.includes("gallery") && (
        <div className="admin-form-group">
          <label htmlFor="newGalleryUrl">Add gallery image URL</label>
          <div className="admin-inline-input-row">
            <input
              id="newGalleryUrl"
              type="text"
              placeholder="https://example.com/image.jpg"
              value={newGalleryUrl}
              onChange={(event) => setNewGalleryUrl(event.target.value)}
            />
            <button
              type="button"
              className="admin-add-row-button"
              onClick={() => {
                const trimmedUrl = newGalleryUrl.trim();
                if (!trimmedUrl) return;

                setFormData((prev) => ({
                  ...prev,
                  galleryImages: [
                    ...prev.galleryImages,
                    {
                      url: trimmedUrl,
                      mode: "landscape",
                    },
                  ],
                }));
                setNewGalleryUrl("");
              }}
            >
              Add URL
            </button>
          </div>

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={async (event) => {
              const files = event.target.files;
              if (!files) return;

              try {
                onNotify?.("Uploading gallery images...");

                const results = await Promise.allSettled(
                  Array.from(files).map((file) => uploadImage(file))
                );

                const uploaded = results.flatMap((result) =>
                  result.status === "fulfilled" ? [result.value] : []
                );

                const uploadedUrls = uploaded.map((r) => r.url);
                const uploadedPublicIds = uploaded.map((r) => r.publicId);

                const failedCount = results.filter(
                  (result) => result.status === "rejected"
                ).length;

                setFormData((prev) => {
                  return {
                    ...prev,
                    galleryImages: [
                      ...prev.galleryImages,
                      ...uploadedUrls.map((url, index) => ({
                        url,
                        publicId: uploadedPublicIds[index],
                        mode: "landscape" as GalleryImagePreset,
                      })),
                    ],
                  };
                });

                if (uploadedUrls.length > 0 && failedCount === 0) {
                  onNotify?.(`${uploadedUrls.length} image(s) uploaded!`);
                }

                if (uploadedUrls.length > 0 && failedCount > 0) {
                  onNotify?.(
                    `${uploadedUrls.length} uploaded, ${failedCount} failed.`
                  );
                }

                if (uploadedUrls.length === 0 && failedCount > 0) {
                  onNotify?.("All uploads failed. Please try again.");
                }
              } catch (error) {
                console.error("Upload failed", error);
                onNotify?.("Unexpected error during upload.");
              }
            }}
          />

          <div className="admin-gallery-settings">
            <label className="admin-checkbox-row">
              <input
                type="checkbox"
                checked={formData.galleryShowThumbnails}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    galleryShowThumbnails: event.target.checked,
                  }))
                }
              />
              <span>Show thumbnail preview strip</span>
            </label>

            <label className="admin-checkbox-row">
              <input
                type="checkbox"
                checked={formData.galleryAutoScroll}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    galleryAutoScroll: event.target.checked,
                  }))
                }
              />
              <span>Auto-scroll gallery images</span>
            </label>
          </div>

          {formData.galleryImages.length > 0 && (
            <div className="admin-gallery-editor-list">
              {formData.galleryImages.map((image, index) => (
                <div
                  key={`${image.url}-${index}`}
                  className="admin-gallery-editor-card"
                >
                  <div
                    className={`admin-gallery-preview-frame ${
                      image.mode === "header"
                        ? "admin-gallery-preview-frame--header"
                        : ""
                    }`}
                    style={{ aspectRatio: getGalleryFrameAspectRatio(image) }}
                  >
                    <img
                      src={image.url}
                      alt={`Gallery preview ${index + 1}`}
                      style={getGalleryMaskPreviewStyle(image)}
                    />
                  </div>

                  <div className="admin-gallery-card-meta">
                    <div className="admin-gallery-card-copy">
                      <strong>Image {index + 1}</strong>
                      <small>
                        {(image.mode ?? "landscape").replace("-", " ")}
                      </small>
                    </div>

                    <div className="admin-gallery-card-actions">
                      <button
                        type="button"
                        className="admin-gallery-action-button"
                        onClick={() =>
                          setOpenGalleryEditorIndex((current) =>
                            current === index ? null : index
                          )
                        }
                      >
                        <Settings2 size={16} />
                        Edit
                      </button>

                      <button
                        type="button"
                        className="admin-gallery-action-button admin-gallery-action-button--danger"
                        onClick={() => {
                          setConfirmMessage("Delete this gallery image?");
                          setConfirmAction(() => async () => {
                            await deleteMedia({
                              url: image.url,
                              publicId: image.publicId,
                              resourceType: "image",
                            });

                            setFormData((prev) => ({
                              ...prev,
                              galleryImages: prev.galleryImages.filter(
                                (_, itemIndex) => itemIndex !== index
                              ),
                            }));
                            setOpenGalleryEditorIndex((current) =>
                              current === index ? null : current
                            );
                            onNotify?.("Image deleted");
                          });

                          setConfirmOpen(true);
                        }}
                      >
                        <Trash2 size={16} />
                        Remove
                      </button>
                    </div>
                  </div>

                  {openGalleryEditorIndex === index && (
                    <div className="admin-gallery-floating-editor">
                      <div className="image-display-controls">
                        <label>
                          Image URL
                          <input
                            type="text"
                            value={image.url}
                            onChange={(event) =>
                              updateGalleryImage(index, (current) => ({
                                ...current,
                                url: event.target.value,
                              }))
                            }
                          />
                        </label>

                        <div className="image-display-mode">
                          <span>Display preset</span>
                          <div className="image-display-mode-buttons">
                            {(
                              [
                                "original",
                                "landscape",
                                "portrait",
                                "square",
                                "header",
                              ] as GalleryImagePreset[]
                            ).map(
                              (mode) => (
                                <button
                                  key={mode}
                                  type="button"
                                  className={
                                    image.mode === mode ? "active" : ""
                                  }
                                  onClick={() =>
                                    updateGalleryImage(index, (current) => ({
                                      ...current,
                                      mode,
                                    }))
                                  }
                                >
                                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );

  const renderMediaSection = () => (
    <>
      {renderSectionHeader(
        "media",
        <Clapperboard size={18} />,
        "Media Content",
        "Upload or link video, audio and PDF resources.",
        getMediaStatus()
      )}

      {!collapsedSections.includes("media") && (
        <>
          <div className="media-dropzone-section">
            <div className="media-links-launcher-wrap">
              <button
                type="button"
                className="media-links-launcher"
                aria-expanded={isMediaLinksOpen}
                onClick={(event) => {
                  event.stopPropagation();
                  setIsMediaLinksOpen((prev) => !prev);
                }}
              >
                <span className="media-links-launcher-label">Add URL</span>
                <span className="media-links-launcher-icon" aria-hidden="true">
                  <Plus
                    size={16}
                    className={isMediaLinksOpen ? "is-open" : ""}
                  />
                </span>
              </button>

              {isMediaLinksOpen && (
                <div
                  className="media-links-popover"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="media-links-popover-header">
                    <div>
                      <strong>Add hosted links</strong>
                      <p>Use external video, audio, or PDF URLs instead.</p>
                    </div>
                  </div>

                  <div className="media-link-grid">
                    <div className="admin-form-group">
                      <label htmlFor="videoUrl">Video Link</label>
                      <div className="media-link-input-row">
                        <input
                          id="videoUrl"
                          type="text"
                          placeholder="YouTube, Vimeo, or hosted video URL"
                          value={mediaLinkDrafts.video}
                          onChange={handleChange}
                        />
                        <button
                          type="button"
                          className="media-link-add-button"
                          onClick={() => addMediaLink("video")}
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    <div className="admin-form-group">
                      <label htmlFor="audioUrl">Audio Link</label>
                      <div className="media-link-input-row">
                        <input
                          id="audioUrl"
                          type="text"
                          placeholder="SoundCloud or hosted audio URL"
                          value={mediaLinkDrafts.audio}
                          onChange={handleChange}
                        />
                        <button
                          type="button"
                          className="media-link-add-button"
                          onClick={() => addMediaLink("audio")}
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    <div className="admin-form-group media-link-grid-full">
                      <label htmlFor="pdfUrl">PDF Link</label>
                      <div className="media-link-input-row">
                        <input
                          id="pdfUrl"
                          type="text"
                          placeholder="/pdfs/sample-report.pdf or https://example.com/file.pdf"
                          value={mediaLinkDrafts.pdf}
                          onChange={handleChange}
                        />
                        <button
                          type="button"
                          className="media-link-add-button"
                          onClick={() => addMediaLink("pdf")}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div
              role="button"
              tabIndex={0}
              className="media-dropzone"
              data-drag-active={isMediaDropActive ? "true" : "false"}
              onClick={() => mediaFileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  mediaFileInputRef.current?.click();
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsMediaDropActive(true);
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsMediaDropActive(true);
              }}
              onDragLeave={(event) => {
                if (event.currentTarget.contains(event.relatedTarget as Node)) {
                  return;
                }

                setIsMediaDropActive(false);
              }}
              onDrop={async (event) => {
                event.preventDefault();
                setIsMediaDropActive(false);
                await uploadMediaFiles(event.dataTransfer.files);
              }}
            >
              {formData.videos.length +
                formData.audios.length +
                formData.pdfs.length ===
              0 ? (
                <>
                  <span className="media-dropzone-icon" aria-hidden="true">
                    <Upload size={28} />
                  </span>
                  <span className="media-dropzone-copy">
                    <strong>Drop files anywhere in this box</strong>
                    <span>Upload video, audio, or PDF files.</span>
                    <small>
                      Drag and drop on desktop, or tap to browse on mobile.
                    </small>
                  </span>
                </>
              ) : null}
              {formData.videos.length +
                formData.audios.length +
                formData.pdfs.length >
                0 && (
                <div className="media-dropzone-preview-grid">
                  {formData.videos.map((item, index) => (
                    <div
                      key={`video-${item.publicId ?? item.url}-${index}`}
                      className="media-dropzone-preview-card"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="media-dropzone-preview-visual">
                        <span className="media-dropzone-preview-badge">
                          <Clapperboard size={14} /> Video
                        </span>
                        {renderMediaPreviewSurface("video", item)}
                      </div>
                      <div className="media-dropzone-preview-copy">
                        <strong>{getMediaPreviewMeta(item.url).title}</strong>
                        <small>{item.url}</small>
                      </div>
                      <button
                        type="button"
                        className="media-dropzone-remove"
                        aria-label="Remove video"
                        onClick={async () => {
                          await removeMediaItem("video", index);
                          onNotify?.("Video removed");
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  {formData.audios.map((item, index) => (
                    <div
                      key={`audio-${item.publicId ?? item.url}-${index}`}
                      className="media-dropzone-preview-card"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="media-dropzone-preview-visual">
                        <span className="media-dropzone-preview-badge">
                          <AudioLines size={14} /> Audio
                        </span>
                        {renderMediaPreviewSurface("audio", item)}
                      </div>
                      <div className="media-dropzone-preview-copy">
                        <strong>{getMediaPreviewMeta(item.url).title}</strong>
                        <small>{item.url}</small>
                      </div>
                      <button
                        type="button"
                        className="media-dropzone-remove"
                        aria-label="Remove audio"
                        onClick={async () => {
                          await removeMediaItem("audio", index);
                          onNotify?.("Audio removed");
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  {formData.pdfs.map((item, index) => (
                    <div
                      key={`pdf-${item.publicId ?? item.url}-${index}`}
                      className="media-dropzone-preview-card"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="media-dropzone-preview-visual">
                        <span className="media-dropzone-preview-badge">
                          <FileText size={14} /> PDF
                        </span>
                        {renderMediaPreviewSurface("pdf", item)}
                      </div>
                      <div className="media-dropzone-preview-copy">
                        <strong>{getMediaPreviewMeta(item.url).title}</strong>
                        <small>{item.url}</small>
                      </div>
                      <button
                        type="button"
                        className="media-dropzone-remove"
                        aria-label="Remove PDF"
                        onClick={async () => {
                          await removeMediaItem("pdf", index);
                          onNotify?.("PDF removed");
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <input
              ref={mediaFileInputRef}
              className="media-dropzone-input"
              type="file"
              accept="video/*,audio/*,application/pdf,.pdf"
              multiple
              onChange={async (event) => {
                const files = event.target.files;
                if (!files?.length) return;

                await uploadMediaFiles(files);
                event.target.value = "";
              }}
            />

            <p className="media-dropzone-note">
              Files upload directly into the project. External links are still
              available if you need them.
            </p>
          </div>
        </>
      )}
    </>
  );

  const renderCodeSection = () => (
    <>
      {renderSectionHeader(
        "code",
        <Code2 size={18} />,
        "Code Preview",
        "Optional code snippets or source content.",
        formData.codeContent.trim() ? "Added" : "Empty"
      )}

      {!collapsedSections.includes("code") && (
        <div className="admin-form-group">
          <label htmlFor="codeContent">Code Content</label>
          <textarea
            id="codeContent"
            rows={6}
            placeholder="Paste code here if this project has a code preview"
            value={formData.codeContent}
            onChange={handleChange}
          />
        </div>
      )}
    </>
  );

  const renderLinksSection = () => (
    <>
      {renderSectionHeader(
        "links",
        <Link2 size={18} />,
        "Project Links",
        "Live demo, GitHub and external links.",
        getLinksStatus()
      )}

      {!collapsedSections.includes("links") && (
        <>
          <div className="admin-form-grid">
            <div className="admin-form-group">
              <label htmlFor="liveUrl">Live Demo URL</label>
              <input
                id="liveUrl"
                type="text"
                placeholder="https://your-live-demo.com"
                value={formData.liveUrl}
                onChange={handleChange}
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="githubUrl">GitHub URL</label>
              <input
                id="githubUrl"
                type="text"
                placeholder="https://github.com/yourusername/project"
                value={formData.githubUrl}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label htmlFor="externalUrl">External URL</label>
            <input
              id="externalUrl"
              type="text"
              placeholder="https://figma.com/... or another external link"
              value={formData.externalUrl}
              onChange={handleChange}
            />
          </div>
        </>
      )}
    </>
  );

  const renderContentBlocksSection = () => (
    <>
      {renderSectionHeader(
        "content",
        <Blocks size={18} />,
        "Content Blocks",
        "Add extra layout sections below the main project description.",
        `${formData.content.length} block${formData.content.length === 1 ? "" : "s"}`
      )}
      {!collapsedSections.includes("content") && (
        <div className="content-block-section">
          <div className="content-block-header">
            <h3>Content Blocks</h3>
            <p>Add extra layout sections below the main project description.</p>
          </div>

          <div className="content-toolbar">
            <button type="button" onClick={() => addContentBlock("paragraph")}>
              + Paragraph
            </button>

            <button type="button" onClick={() => addContentBlock("image")}>
              + Image
            </button>

            <button type="button" onClick={() => addContentBlock("video")}>
              + Video
            </button>

            <button type="button" onClick={() => addContentBlock("quote")}>
              + Quote
            </button>

            <button type="button" onClick={() => addContentBlock("divider")}>
              + Divider
            </button>

            <button type="button" onClick={() => addContentBlock("twoColumn")}>
              + Two Column
            </button>

            <button type="button" onClick={() => addContentBlock("mediaText")}>
              + Media + Text
            </button>
          </div>

          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={formData.content.map((_, i) => i.toString())}
              strategy={verticalListSortingStrategy}
            >
              <div className="content-editor-list">
                {formData.content?.length === 0 && (
                  <div className="admin-empty-state">
                    <p>
                      No content blocks yet. Add paragraphs, images, quotes, and
                      layouts above.
                    </p>
                  </div>
                )}

                {formData.content?.map((block, index) => (
                  <SortableItem key={index} id={index.toString()}>
                    <div key={index} className="content-editor-card">
                      <div className="content-editor-card-header">
                        <button
                          type="button"
                          className="content-collapse-button"
                          onClick={() => toggleBlockCollapse(index)}
                        >
                          {collapsedBlocks.includes(index) ? (
                            <ChevronRight size={17} />
                          ) : (
                            <ChevronDown size={17} />
                          )}

                          {(() => {
                            const preview = getBlockPreview(block, index);

                            return (
                              <span className="block-preview">
                                <span className="block-preview-type">
                                  {preview.label}
                                </span>

                                {preview.text && (
                                  <span className="block-preview-text">
                                    {preview.text}
                                  </span>
                                )}
                              </span>
                            );
                          })()}
                        </button>

                        <div className="content-editor-actions">
                          <button
                            type="button"
                            className="content-editor-duplicate"
                            onClick={() => duplicateContentBlock(index)}
                          >
                            Duplicate
                          </button>

                          {pendingDeleteBlockIndex === index ? (
                            <div className="content-delete-confirmation">
                              <button
                                type="button"
                                className="content-editor-confirm-delete"
                                onClick={() => deleteContentBlock(index)}
                              >
                                Confirm delete
                              </button>

                              <button
                                type="button"
                                className="content-editor-cancel-delete"
                                onClick={() => setPendingDeleteBlockIndex(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="content-editor-remove"
                              onClick={() => setPendingDeleteBlockIndex(index)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                      {!collapsedBlocks.includes(index) && (
                        <div className="content-editor-card-body">
                          {(block.type === "paragraph" ||
                            block.type === "quote") && (
                            <textarea
                              rows={4}
                              placeholder={
                                block.type === "quote"
                                  ? "Write quote text"
                                  : "Write paragraph text"
                              }
                              value={block.text}
                              onChange={(event) => {
                                updateContentBlock(index, {
                                  ...block,
                                  text: event.target.value,
                                });
                              }}
                            />
                          )}

                          {block.type === "paragraph" &&
                            renderAlignmentButtons(block.align, (align) => {
                              updateContentBlock(index, {
                                ...block,
                                align,
                              });
                            })}

                          {block.type === "image" && (
                            <>
                              <input
                                placeholder="Image URL"
                                value={block.url}
                                onChange={(event) => {
                                  updateContentBlock(index, {
                                    ...block,
                                    url: event.target.value,
                                  });
                                }}
                              />

                              <input
                                placeholder="Image alt text"
                                value={block.alt}
                                onChange={(event) => {
                                  updateContentBlock(index, {
                                    ...block,
                                    alt: event.target.value,
                                  });
                                }}
                              />

                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (event) => {
                                  const file = event.target.files?.[0];
                                  if (!file) return;

                                  const result = await uploadContentImage(
                                    file,
                                    (imageUrl) => {
                                      patchContentBlock(
                                        index,
                                        (currentBlock) => ({
                                          ...currentBlock,
                                          url: imageUrl,
                                        })
                                      );
                                    },
                                    "Uploading content image...",
                                    "Content image uploaded!",
                                    "Content image upload failed."
                                  );

                                  if (result?.publicId) {
                                    patchContentBlock(
                                      index,
                                      (currentBlock) => ({
                                        ...currentBlock,
                                        publicId: result.publicId,
                                      })
                                    );
                                  }
                                }}
                              />

                              {block.url && (
                                <div className="upload-preview">
                                  <img
                                    src={block.url}
                                    alt={block.alt || "Preview"}
                                  />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateContentBlock(index, {
                                        ...block,
                                        url: "",
                                        publicId: undefined,
                                      });
                                    }}
                                  >
                                    Remove image
                                  </button>
                                </div>
                              )}
                            </>
                          )}

                          {block.type === "video" && (
                            <>
                              <input
                                placeholder="MP4/WebM video URL"
                                value={block.url}
                                onChange={(event) => {
                                  updateContentBlock(index, {
                                    ...block,
                                    url: event.target.value,
                                  });
                                }}
                              />

                              <input
                                placeholder="Optional caption"
                                value={block.caption ?? ""}
                                onChange={(event) => {
                                  updateContentBlock(index, {
                                    ...block,
                                    caption: event.target.value,
                                  });
                                }}
                              />

                              <input
                                type="file"
                                accept="video/mp4,video/webm,video/ogg"
                                onChange={async (event) => {
                                  const file = event.target.files?.[0];
                                  if (!file) return;

                                  const result = await uploadContentMedia(
                                    file,
                                    "video",
                                    (videoUrl) => {
                                      patchContentBlock(
                                        index,
                                        (currentBlock) => ({
                                          ...currentBlock,
                                          url: videoUrl,
                                        })
                                      );
                                    }
                                  );

                                  if (result?.publicId) {
                                    patchContentBlock(
                                      index,
                                      (currentBlock) => ({
                                        ...currentBlock,
                                        publicId: result.publicId,
                                      })
                                    );
                                  }
                                }}
                              />

                              {block.url && (
                                <div className="upload-preview">
                                  <video
                                    src={block.url}
                                    className="upload-preview-video"
                                    controls
                                    muted
                                    playsInline
                                  />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmMessage("Delete this video?");
                                      setConfirmAction(() => async () => {
                                        await deleteMedia({
                                          url: block.url,
                                          publicId: block.publicId,
                                          resourceType: "video",
                                        });

                                        updateContentBlock(index, {
                                          ...block,
                                          url: "",
                                          publicId: undefined,
                                        });

                                        onNotify?.("Video deleted");
                                      });

                                      setConfirmOpen(true);
                                    }}
                                  >
                                    Remove video
                                  </button>
                                </div>
                              )}
                            </>
                          )}

                          {block.type === "twoColumn" && (
                            <>
                              {renderAlignmentButtons(block.align, (align) => {
                                updateContentBlock(index, {
                                  ...block,
                                  align,
                                });
                              })}

                              <textarea
                                rows={4}
                                placeholder="Left column text"
                                value={block.left}
                                onChange={(event) => {
                                  updateContentBlock(index, {
                                    ...block,
                                    left: event.target.value,
                                  });
                                }}
                              />

                              <textarea
                                rows={4}
                                placeholder="Right column text"
                                value={block.right}
                                onChange={(event) => {
                                  updateContentBlock(index, {
                                    ...block,
                                    right: event.target.value,
                                  });
                                }}
                              />
                            </>
                          )}

                          {block.type === "mediaText" && (
                            <>
                              {renderMediaLayoutButtons(
                                block.layout,
                                (layout) => {
                                  updateContentBlock(index, {
                                    ...block,
                                    layout,
                                  });
                                }
                              )}

                              {block.layout !== "image-image" &&
                                renderAlignmentButtons(block.align, (align) => {
                                  updateContentBlock(index, {
                                    ...block,
                                    align,
                                  });
                                })}
                              <select
                                value={block.mediaType ?? "image"}
                                onChange={(event) => {
                                  updateContentBlock(index, {
                                    ...block,
                                    mediaType: event.target.value as
                                      | "image"
                                      | "video",
                                  });
                                }}
                              >
                                <option value="image">Image</option>
                                <option value="video">Video</option>
                              </select>
                              <input
                                placeholder={
                                  block.mediaType === "video"
                                    ? "MP4/WebM video URL"
                                    : "Left/main image URL"
                                }
                                value={block.imageUrl}
                                onChange={(event) => {
                                  updateContentBlock(index, {
                                    ...block,
                                    imageUrl: event.target.value,
                                  });
                                }}
                              />

                              <input
                                type="file"
                                accept={
                                  block.mediaType === "video"
                                    ? "video/mp4,video/webm"
                                    : "image/*"
                                }
                                onChange={async (event) => {
                                  const file = event.target.files?.[0];
                                  if (!file) return;

                                  const result = await uploadContentMedia(
                                    file,
                                    block.mediaType ?? "image",
                                    (imageUrl) => {
                                      patchContentBlock(
                                        index,
                                        (currentBlock) => ({
                                          ...currentBlock,
                                          imageUrl,
                                        })
                                      );
                                    }
                                  );

                                  if (result?.publicId) {
                                    patchContentBlock(
                                      index,
                                      (currentBlock) => ({
                                        ...currentBlock,
                                        publicId: result.publicId,
                                      })
                                    );
                                  }
                                }}
                              />

                              {block.imageUrl && (
                                <div className="upload-preview">
                                  {block.mediaType === "video" ? (
                                    <video
                                      src={block.imageUrl}
                                      className="upload-preview-video"
                                      controls
                                      muted
                                      playsInline
                                    />
                                  ) : (
                                    <img
                                      src={block.imageUrl}
                                      alt={block.imageAlt || "Media preview"}
                                    />
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmMessage(
                                        block.mediaType === "video"
                                          ? "Delete this video?"
                                          : "Delete this image?"
                                      );

                                      setConfirmAction(() => async () => {
                                        await deleteMedia({
                                          url: block.imageUrl,
                                          publicId: block.publicId,
                                          resourceType:
                                            block.mediaType === "video"
                                              ? "video"
                                              : "image",
                                        });

                                        updateContentBlock(index, {
                                          ...block,
                                          imageUrl: "",
                                          publicId: undefined,
                                        });

                                        onNotify?.(
                                          block.mediaType === "video"
                                            ? "Video deleted"
                                            : "Image deleted"
                                        );
                                      });

                                      setConfirmOpen(true);
                                    }}
                                  >
                                    {block.mediaType === "video"
                                      ? "Remove video"
                                      : "Remove image"}
                                  </button>
                                </div>
                              )}

                              {block.layout !== "image-image" && (
                                <textarea
                                  rows={5}
                                  placeholder="Text beside image"
                                  value={block.text}
                                  onChange={(event) => {
                                    updateContentBlock(index, {
                                      ...block,
                                      text: event.target.value,
                                    });
                                  }}
                                />
                              )}

                              {(block.layout === "image-text-image" ||
                                block.layout === "image-image") && (
                                <>
                                  <input
                                    placeholder="Right image URL"
                                    value={block.imageUrlRight ?? ""}
                                    onChange={(event) => {
                                      updateContentBlock(index, {
                                        ...block,
                                        imageUrlRight: event.target.value,
                                      });
                                    }}
                                  />

                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (event) => {
                                      const file = event.target.files?.[0];
                                      if (!file) return;

                                      const result = await uploadContentImage(
                                        file,
                                        (imageUrl) => {
                                          patchContentBlock(
                                            index,
                                            (currentBlock) => ({
                                              ...currentBlock,
                                              imageUrlRight: imageUrl,
                                            })
                                          );
                                        },
                                        "Uploading right media image...",
                                        "Right media image uploaded!",
                                        "Right media image upload failed."
                                      );

                                      if (result?.publicId) {
                                        patchContentBlock(
                                          index,
                                          (currentBlock) => ({
                                            ...currentBlock,
                                            publicIdRight: result.publicId,
                                          })
                                        );
                                      }
                                    }}
                                  />

                                  {block.imageUrlRight && (
                                    <div className="upload-preview">
                                      <img
                                        src={block.imageUrlRight}
                                        alt={
                                          block.imageAltRight ||
                                          "Right media preview"
                                        }
                                      />

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setConfirmMessage(
                                            "Delete this image?"
                                          );

                                          setConfirmAction(() => async () => {
                                            await deleteMedia({
                                              url: block.imageUrlRight,
                                              publicId: block.publicIdRight,
                                              resourceType: "image",
                                            });

                                            updateContentBlock(index, {
                                              ...block,
                                              imageUrlRight: "",
                                              publicIdRight: undefined,
                                            });

                                            onNotify?.("Image deleted");
                                          });

                                          setConfirmOpen(true);
                                        }}
                                      >
                                        Remove right image
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </>
  );
  void renderContentBlocksSection;

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <section className="admin-form-panel">
        <div className="admin-form-panel-header">
          <div>
            <h3>Project Basics</h3>
            <p>Core details shown across the portfolio.</p>
          </div>

          <div className="admin-panel-actions">
            {headerActions}

            <button
              type="button"
              className={`admin-pin-button admin-pin-action admin-pin-action-icon ${
                pinnedValue ? "active" : ""
              }`}
              aria-label={pinnedValue ? "Unpin project" : "Pin project"}
              data-label={pinnedValue ? "Pinned" : "Pin project"}
              title={pinnedValue ? "Pinned" : "Pin project"}
              onClick={() => {
                const nextPinned = !pinnedValue;

                if (onPinnedChange) {
                  onPinnedChange(nextPinned);
                  return;
                }

                setFormData((prev) => ({
                  ...prev,
                  pinned: nextPinned,
                }));
              }}
            >
              <Pin size={20} />
            </button>
          </div>
        </div>

        <div className="admin-form-group">
          <label htmlFor="title">Project Title</label>
          <input
            id="title"
            type="text"
            placeholder="Enter project title"
            value={formData.title}
            onChange={handleChange}
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="">Select a category</option>
            <option value="Photography">Photography</option>
            <option value="Graphic Design">Graphic Design</option>
            <option value="Audio Design">Audio Design</option>
            <option value="Frontend/Web Design">Frontend/Web Design</option>
            <option value="Full-Stack/Web Development">
              Full-Stack/Web Development
            </option>
            <option value="Mobile Design">Mobile Design</option>
            <option value="Machine Learning">Machine Learning</option>
            <option value="Deep Learning">Deep Learning</option>
            <option value="Code Project">Code Project</option>
            <option value="Technical Case Study">Technical Case Study</option>
          </select>
        </div>

        {renderCoverSection()}
      </section>

      <section className="admin-form-panel admin-form-panel-group">
        <div className="admin-form-panel-header">
          <div>
            <h3>Assets</h3>
            <p>Manage cover, gallery, uploaded media, and linked resources.</p>
          </div>
        </div>

        {renderGallerySection()}
        {renderMediaSection()}
      </section>

      <section className="admin-form-panel admin-form-panel-group admin-form-panel-editor">
        <div className="admin-form-panel-header">
          <div>
            <h3>Project Body</h3>
            <p>Tiptap is the single editor for rich project content.</p>
          </div>
        </div>

        <ProjectTiptapEditor
          value={ensureProjectContentJson(formData.contentJson, formData.content)}
          onChange={handleRichTextContentChange}
          onNotify={onNotify}
          disabled={false}
          hasPendingUploads={hasPendingUploads}
          stageImage={(file) => stageRichTextMedia(file, "image")}
          stageVideo={(file) => stageRichTextMedia(file, "video")}
        />

        {renderContentBlocksSection()}
      </section>

      <section className="admin-form-panel admin-form-panel-group">
        <div className="admin-form-panel-header">
          <div>
            <h3>Advanced</h3>
            <p>Code previews, links, and metadata that support the project.</p>
          </div>
        </div>

        {renderCodeSection()}
        {renderLinksSection()}

        <div className="admin-form-subsection">
          <div className="admin-form-panel-header">
            <div>
              <h3>Tags</h3>
              <p>Keep project tags aligned with the public project footer.</p>
            </div>
          </div>

          <div className="admin-form-group">
            <label htmlFor="tags">Tags</label>
            <input
              id="tags"
              type="text"
              placeholder="e.g. react, ui, portfolio, machine-learning"
              value={formData.tags}
              onChange={handleChange}
            />
            <small>Separate tags with commas.</small>
          </div>
        </div>
      </section>

      <div className="admin-page-savebar">
        <div>
          <strong>Ready to publish changes</strong>
          <span>
            {hasPendingUploads
              ? "Uploads are still processing. Save will unlock when they finish."
              : "Save your project once the content and assets look right."}
          </span>
        </div>

        <div className="admin-form-actions">
          <button
            type="submit"
            className="admin-primary-button"
            disabled={hasPendingUploads}
          >
            <Save size={16} />
            {submitLabel}
          </button>
        </div>
      </div>
      {renderConfirmModal()}
    </form>
  );
}

export type { ProjectFormData };
export default ProjectForm;
