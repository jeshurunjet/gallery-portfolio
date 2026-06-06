import { useState } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  AudioLines,
  Blocks,
  Bold,
  Clapperboard,
  Code2,
  Settings2,
  Images,
  Italic,
  FileText,
  Image as ImageIcon,
  Link2,
  List,
  ListOrdered,
  Pin,
  Minus,
  PanelLeft,
  PanelRight,
  PanelsLeftRight,
  ChevronDown,
  ChevronRight,
  Trash2,
  Underline,
} from "lucide-react";
import { API_BASE_URL } from "../config";
import type {
  DisplayImageMode,
  GalleryImage,
  ProjectContentBlock,
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

type ProjectFormData = {
  title: string;
  category: string;
  description: string;
  content: ProjectContentBlock[];
  tags: string;
  cover: string;
  coverPublicId?: string;
  galleryImages: GalleryImage[];
  galleryShowThumbnails: boolean;
  galleryAutoScroll: boolean;
  videoUrl: string;
  videoPublicId?: string;
  audioUrl: string;
  audioPublicId?: string;
  pdfUrl: string;
  pdfPublicId?: string;
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
};

type BlockType =
  | "paragraph"
  | "image"
  | "video"
  | "quote"
  | "divider"
  | "twoColumn"
  | "mediaText";

type TextAlignOption = "left" | "center" | "right" | "justify";

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
}: ProjectFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>(initialData);
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
    const zoom = Math.max(100, Math.min(220, image.zoom ?? 100));
    const offsetX = Math.max(-50, Math.min(50, image.offsetX ?? 0));
    const offsetY = Math.max(-50, Math.min(50, image.offsetY ?? 0));
    return {
      width: `${zoom}%`,
      height: "auto",
      minWidth: "100%",
      minHeight: "100%",
      maxWidth: "none",
      left: "50%",
      top: "50%",
      transform: `translate(calc(-50% + ${offsetX}%),
        calc(-50% + ${offsetY}%))`,
    };
  };

  const getGalleryFrameAspectRatio = (image: GalleryImage) => {
    const mode = image.mode ?? "default";
    const baseHeight = mode === "header" ? 5 : 9;
    const frameScale = Math.max(20, Math.min(100, image.frameHeight ?? 100));
    return `16 / ${(baseHeight * frameScale) / 100}`;
  };

  const getFrameHeightPixels = (image: GalleryImage) => {
    const mode = image.mode ?? "default";
    const baseHeight = mode === "header" ? 5 : 9;
    const baseWidth = 640;
    const frameScale = Math.max(20, Math.min(100, image.frameHeight ?? 100));
    return Math.round((baseWidth * ((baseHeight * frameScale) / 100)) / 16);
  };

  const getZoomPixels = (image: GalleryImage) => {
    const zoom = Math.max(100, Math.min(220, image.zoom ?? 100));
    return Math.round((640 * zoom) / 100);
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
    let block: ProjectContentBlock;

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
    updatedBlock: ProjectContentBlock
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
    updater: (block: ProjectContentBlock) => ProjectContentBlock
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

  const deleteBlockAssets = async (block: ProjectContentBlock) => {
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
      return { url: data.url as string, publicId: data.public_id as string };
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

    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const formatSelectedText = (
    field: keyof ProjectFormData,
    before: string,
    after: string = before
  ) => {
    const textarea = document.getElementById(
      field
    ) as HTMLTextAreaElement | null;

    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = formData[field];

    if (typeof currentValue !== "string") return;

    const selectedText = currentValue.slice(start, end);

    const replacement = selectedText
      ? `${before}${selectedText}${after}`
      : `${before}Text${after}`;

    const updatedValue =
      currentValue.slice(0, start) + replacement + currentValue.slice(end);

    setFormData((prev) => ({
      ...prev,
      [field]: updatedValue,
    }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + (selectedText || "Text").length
      );
    }, 0);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (hasPendingUploads) {
      onNotify?.("Please wait for uploads to finish before saving.");
      return;
    }

    onSubmit({
      ...formData,
      pinned: pinnedValue,
    });
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

  const getBlockPreview = (block: ProjectContentBlock, index: number) => {
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
      formData.videoUrl ? <Clapperboard key="video" size={15} /> : null,
      formData.audioUrl ? <AudioLines key="audio" size={15} /> : null,
      formData.pdfUrl ? <FileText key="pdf" size={15} /> : null,
    ].filter(Boolean);

    return mediaIcons.length > 0 ? (
      <span className="admin-section-status-icons">{mediaIcons}</span>
    ) : (
      "Empty"
    );
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
                      mode: "default",
                      frameHeight: 100,
                      zoom: 100,
                      offsetX: 0,
                      offsetY: 0,
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
                        mode: "default" as DisplayImageMode,
                        frameHeight: 100,
                        zoom: 100,
                        offsetX: 0,
                        offsetY: 0,
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
                        {image.mode === "header"
                          ? "Header style"
                          : "Default style"}
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
                          <span>Display mode</span>
                          <div className="image-display-mode-buttons">
                            {(["default", "header"] as DisplayImageMode[]).map(
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
                                      frameHeight:
                                        mode === "header" &&
                                        (current.frameHeight ?? 100) > 60
                                          ? 60
                                          : current.frameHeight,
                                    }))
                                  }
                                >
                                  {mode === "header" ? "Header" : "Default"}
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        <label>
                          <span className="range-label-row">
                            <span>Frame height</span>
                            <small>
                              {image.frameHeight ?? 100}% ·{" "}
                              {getFrameHeightPixels(image)}px
                            </small>
                          </span>
                          <input
                            className="admin-range-slider"
                            type="range"
                            min={image.mode === "header" ? "20" : "20"}
                            max="100"
                            value={image.frameHeight ?? 100}
                            onChange={(event) =>
                              updateGalleryImage(index, (current) => ({
                                ...current,
                                frameHeight: Number(event.target.value),
                              }))
                            }
                          />
                        </label>

                        <div className="image-display-mode">
                          <span>Zoom presets</span>
                          <div className="image-display-mode-buttons">
                            {[100, 115, 130, 150].map((value) => (
                              <button
                                key={value}
                                type="button"
                                className={image.zoom === value ? "active" : ""}
                                onClick={() =>
                                  updateGalleryImage(index, (current) => ({
                                    ...current,
                                    zoom: value,
                                  }))
                                }
                              >
                                {value === 100 ? "Fit" : `${value}%`}
                              </button>
                            ))}
                          </div>
                        </div>

                        <label>
                          <span className="range-label-row">
                            <span>Zoom image</span>
                            <small>
                              {image.zoom ?? 100}% · {getZoomPixels(image)}px
                              wide
                            </small>
                          </span>
                          <input
                            className="admin-range-slider"
                            type="range"
                            min="100"
                            max="220"
                            value={image.zoom ?? 100}
                            onChange={(event) =>
                              updateGalleryImage(index, (current) => ({
                                ...current,
                                zoom: Number(event.target.value),
                              }))
                            }
                          />
                        </label>

                        <label>
                          <span className="range-label-row">
                            <span>Move image left / right</span>
                            <small>{image.offsetX ?? 0}</small>
                          </span>
                          <input
                            className="admin-range-slider"
                            type="range"
                            min="-50"
                            max="50"
                            value={image.offsetX ?? 0}
                            onChange={(event) =>
                              updateGalleryImage(index, (current) => ({
                                ...current,
                                offsetX: Number(event.target.value),
                              }))
                            }
                          />
                        </label>

                        <label>
                          <span className="range-label-row">
                            <span>Move image up / down</span>
                            <small>{image.offsetY ?? 0}</small>
                          </span>
                          <input
                            className="admin-range-slider"
                            type="range"
                            min="-50"
                            max="50"
                            value={image.offsetY ?? 0}
                            onChange={(event) =>
                              updateGalleryImage(index, (current) => ({
                                ...current,
                                offsetY: Number(event.target.value),
                              }))
                            }
                          />
                        </label>
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
        "Video, audio and PDF resources.",
        getMediaStatus()
      )}

      {!collapsedSections.includes("media") && (
        <>
          <div className="admin-form-group">
            <label htmlFor="videoUrl">Video URL</label>
            <input
              id="videoUrl"
              type="text"
              placeholder="YouTube, Vimeo, or video link"
              value={formData.videoUrl}
              onChange={handleChange}
            />
            {formData.videoUrl && (
              <div className="upload-preview">
                <div className="media-url-preview">{formData.videoUrl}</div>

                <button
                  type="button"
                  onClick={() => {
                    setConfirmMessage("Delete this video?");
                    setConfirmAction(() => async () => {
                      await deleteMedia({
                        url: formData.videoUrl,
                        publicId: formData.videoPublicId,
                        resourceType: "video",
                      });

                      setFormData((prev) => ({
                        ...prev,
                        videoUrl: "",
                        videoPublicId: undefined,
                      }));
                      onNotify?.("Video deleted");
                    });

                    setConfirmOpen(true);
                  }}
                >
                  Remove video
                </button>
              </div>
            )}
          </div>

          <div className="admin-form-group">
            <label htmlFor="audioUrl">Audio URL</label>
            <input
              id="audioUrl"
              type="text"
              placeholder="SoundCloud or audio link"
              value={formData.audioUrl}
              onChange={handleChange}
            />
            {formData.audioUrl && (
              <div className="upload-preview">
                <div className="media-url-preview">{formData.audioUrl}</div>

                <button
                  type="button"
                  onClick={() => {
                    setConfirmMessage("Delete this audio?");
                    setConfirmAction(() => async () => {
                      await deleteMedia({ url: formData.audioUrl });

                      setFormData((prev) => ({
                        ...prev,
                        audioUrl: "",
                        audioPublicId: undefined,
                      }));
                      onNotify?.("Audio deleted");
                    });

                    setConfirmOpen(true);
                  }}
                >
                  Remove audio
                </button>
              </div>
            )}
          </div>

          <div className="admin-form-group">
            <label htmlFor="pdfUrl">PDF URL</label>
            <input
              id="pdfUrl"
              type="text"
              placeholder="/pdfs/sample-report.pdf or https://example.com/file.pdf"
              value={formData.pdfUrl}
              onChange={handleChange}
            />

            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;

                try {
                  onNotify?.("Uploading PDF...");
                  const result = await uploadPdf(file);

                  setFormData((prev) => ({
                    ...prev,
                    pdfUrl: result.url,
                    pdfPublicId: result.publicId,
                  }));

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
                      : "PDF upload failed. Please try again."
                  );
                }
              }}
            />

            {formData.pdfUrl && (
              <div className="upload-preview">
                <div className="media-url-preview">{formData.pdfUrl}</div>

                <button
                  type="button"
                  onClick={() => {
                    setConfirmMessage("Delete this PDF?");
                    setConfirmAction(() => async () => {
                      await deleteMedia({
                        url: formData.pdfUrl,
                        publicId: formData.pdfPublicId,
                        resourceType: "image",
                      });

                      setFormData((prev) => ({
                        ...prev,
                        pdfUrl: "",
                        pdfPublicId: undefined,
                      }));
                      onNotify?.("PDF deleted");
                    });

                    setConfirmOpen(true);
                  }}
                >
                  Remove PDF
                </button>
              </div>
            )}
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

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <section className="admin-form-panel">
        <div className="admin-form-panel-header">
          <h3>Project Basics</h3>
          <p>Core details shown across the portfolio.</p>
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

        <button
          type="button"
          className={`project-pin-toggle ${pinnedValue ? "active" : ""}`}
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
          <span className="project-pin-icon">
            <Pin size={18} />
          </span>
          <span>
            <strong>
              {pinnedValue ? "Pinned to homepage" : "Pin project"}
            </strong>
            <small>
              {pinnedValue
                ? "This project stays above the regular sort order."
                : "Keep this project at the top of the gallery."}
            </small>
          </span>
        </button>

        {renderCoverSection()}

        <div className="admin-form-group">
          <label htmlFor="description">Description</label>

          <div className="format-toolbar">
            <button
              type="button"
              title="Bold"
              aria-label="Bold"
              onClick={() => formatSelectedText("description", "**")}
            >
              <Bold size={17} />
            </button>

            <button
              type="button"
              title="Italic"
              aria-label="Italic"
              onClick={() => formatSelectedText("description", "*")}
            >
              <Italic size={17} />
            </button>

            <button
              type="button"
              title="Underline"
              aria-label="Underline"
              onClick={() => formatSelectedText("description", "__")}
            >
              <Underline size={17} />
            </button>

            <button
              type="button"
              title="Bullet list"
              aria-label="Bullet list"
              onClick={() => formatSelectedText("description", "- ", "")}
            >
              <List size={17} />
            </button>

            <button
              type="button"
              title="Numbered list"
              aria-label="Numbered list"
              onClick={() => {
                const lines = formData.description.split("\n");
                let lastNumber = 0;

                for (let i = lines.length - 1; i >= 0; i--) {
                  const match = lines[i].trim().match(/^(\d+)\.\s/);

                  if (match) {
                    lastNumber = parseInt(match[1], 10);
                    break;
                  }
                }

                const nextNumber = lastNumber + 1;

                setFormData((prev) => ({
                  ...prev,
                  description:
                    prev.description +
                    (prev.description ? "\n" : "") +
                    `${nextNumber}. `,
                }));
              }}
            >
              <ListOrdered size={17} />
            </button>

            <button
              type="button"
              title="Separator"
              aria-label="Separator"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  description: `${prev.description}${prev.description ? "\n" : ""}---`,
                }))
              }
            >
              <Minus size={17} />
            </button>
          </div>

          <textarea
            id="description"
            rows={7}
            placeholder="Write a short project description"
            value={formData.description}
            onChange={handleChange}
          />

          <small>
            Supports **bold**, *italic*, __underline__, bullet lists, numbered
            lists, and --- separators.
          </small>
        </div>
      </section>

      {renderGallerySection()}
      {renderMediaSection()}
      {renderCodeSection()}
      {renderLinksSection()}

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

      {renderContentBlocksSection()}
      <div className="admin-form-actions">
        <button
          type="submit"
          className="admin-primary-button"
          disabled={hasPendingUploads}
        >
          {submitLabel}
        </button>
        {hasPendingUploads ? (
          <p className="admin-form-status">
            Upload in progress. Please wait before saving.
          </p>
        ) : null}
      </div>
      {renderConfirmModal()}
    </form>
  );
}

export type { ProjectFormData };
export default ProjectForm;
