import { useState } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Images,
  PanelLeft,
  PanelRight,
  PanelsLeftRight,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { API_BASE_URL } from "../config";
import type { ProjectContentBlock } from "../data/projects";
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

type ProjectFormData = {
  title: string;
  category: string;
  description: string;
  content: ProjectContentBlock[];
  tags: string;
  cover: string;
  images: string;
  videoUrl: string;
  audioUrl: string;
  pdfUrl: string;
  codeContent: string;
  liveUrl: string;
  githubUrl: string;
  externalUrl: string;
};

type ProjectFormProps = {
  initialData: ProjectFormData;
  submitLabel: string;
  onSubmit: (data: ProjectFormData) => void;
  onNotify?: (message: string) => void;
};

type BlockType =
  | "paragraph"
  | "image"
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
}: ProjectFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>(initialData);
  const [collapsedBlocks, setCollapsedBlocks] = useState<number[]>(
    initialData.content?.map((_, index) => index) ?? []
  );
  const toggleBlockCollapse = (index: number) => {
    setCollapsedBlocks((prev) =>
      prev.includes(index)
        ? prev.filter((item) => item !== index)
        : [...prev, index]
    );
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

  const uploadImage = async (file: File) => {
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

      window.location.href = "/admin/login";

      throw new Error("Session expired");
    }

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    return response.text();
  };

  const uploadContentImage = async (
    file: File,
    onSuccess: (imageUrl: string) => void,
    loadingMessage = "Uploading content image...",
    successMessage = "Content image uploaded!",
    errorMessage = "Content image upload failed."
  ) => {
    try {
      onNotify?.(loadingMessage);

      const imageUrl = await uploadImage(file);

      onSuccess(imageUrl);

      onNotify?.(successMessage);
    } catch (error) {
      console.error(error);
      onNotify?.(errorMessage);
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
    onSubmit(formData);
  };

  const getBlockPreview = (block: ProjectContentBlock, index: number) => {
    switch (block.type) {
      case "paragraph":
        return `Paragraph — ${block.text?.slice(0, 40) || "Empty"}...`;

      case "quote":
        return `Quote — "${block.text?.slice(0, 30) || "Empty"}..."`;

      case "image":
        return "Image block";

      case "twoColumn":
        return "Two column layout";

      case "mediaText":
        switch (block.layout) {
          case "image-left":
            return "Media: image + text";

          case "image-right":
            return "Media: text + image";

          case "image-text-image":
            return "Media: image + text + image";

          case "image-image":
            return "Media: image + image";

          default:
            return "Media block";
        }

      default:
        return `Block ${index + 1}`;
    }
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

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
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
        <select id="category" value={formData.category} onChange={handleChange}>
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

      <div className="admin-form-group">
        <label htmlFor="description">Description</label>

        <div className="format-toolbar">
          <button
            type="button"
            onClick={() => formatSelectedText("description", "**")}
          >
            Bold
          </button>

          <button
            type="button"
            onClick={() => formatSelectedText("description", "*")}
          >
            Italic
          </button>

          <button
            type="button"
            onClick={() => formatSelectedText("description", "__")}
          >
            Underline
          </button>

          <button
            type="button"
            onClick={() => formatSelectedText("description", "- ", "")}
          >
            Bullet
          </button>

          <button
            type="button"
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
            Numbered
          </button>

          <button
            type="button"
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                description: `${prev.description}${prev.description ? "\n" : ""}---`,
              }))
            }
          >
            Separator
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
                    layouts above. Content blocks also support **bold**,
                    *italic*, __underline__, bullet lists, numbered lists, and
                    --- separators.
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

                        <span>{getBlockPreview(block, index)}</span>
                      </button>

                      <button
                        type="button"
                        className="content-editor-remove"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            content: prev.content.filter((_, i) => i !== index),
                          }));
                        }}
                      >
                        Remove
                      </button>
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

                                await uploadContentImage(
                                  file,
                                  (imageUrl) => {
                                    updateContentBlock(index, {
                                      ...block,
                                      url: imageUrl,
                                    });
                                  },
                                  "Uploading content image...",
                                  "Content image uploaded!",
                                  "Content image upload failed."
                                );
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
                                    });
                                  }}
                                >
                                  Remove image
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

                            <input
                              placeholder="Left/main image URL"
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
                              accept="image/*"
                              onChange={async (event) => {
                                const file = event.target.files?.[0];
                                if (!file) return;

                                await uploadContentImage(
                                  file,
                                  (imageUrl) => {
                                    updateContentBlock(index, {
                                      ...block,
                                      imageUrl,
                                    });
                                  },
                                  "Uploading media image...",
                                  "Media image uploaded!",
                                  "Media image upload failed."
                                );
                              }}
                            />

                            {block.imageUrl && (
                              <div className="upload-preview">
                                <img
                                  src={block.imageUrl}
                                  alt={block.imageAlt || "Media preview"}
                                />

                                <button
                                  type="button"
                                  onClick={() => {
                                    updateContentBlock(index, {
                                      ...block,
                                      imageUrl: "",
                                    });
                                  }}
                                >
                                  Remove image
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

                                    await uploadContentImage(
                                      file,
                                      (imageUrl) => {
                                        updateContentBlock(index, {
                                          ...block,
                                          imageUrlRight: imageUrl,
                                        });
                                      },
                                      "Uploading right media image...",
                                      "Right media image uploaded!",
                                      "Right media image upload failed."
                                    );
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
                                        updateContentBlock(index, {
                                          ...block,
                                          imageUrlRight: "",
                                        });
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
              const imageUrl = await uploadImage(file);

              setFormData((prev) => ({
                ...prev,
                cover: imageUrl,
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
                }))
              }
            >
              Remove cover
            </button>
          </div>
        )}
      </div>

      <div className="admin-form-group">
        <label htmlFor="images">Image Gallery URLs</label>
        <textarea
          id="images"
          rows={3}
          placeholder="Paste image URLs separated by commas"
          value={formData.images}
          onChange={handleChange}
        />

        <small>Separate multiple image URLs with commas.</small>

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

              const uploadedUrls = results
                .filter(
                  (result): result is PromiseFulfilledResult<string> =>
                    result.status === "fulfilled"
                )
                .map((result) => result.value);

              const failedCount = results.filter(
                (result) => result.status === "rejected"
              ).length;

              setFormData((prev) => {
                const existing = prev.images
                  ? prev.images
                      .split(",")
                      .map((image) => image.trim())
                      .filter(Boolean)
                  : [];

                const combined = [...existing, ...uploadedUrls];

                return {
                  ...prev,
                  images: combined.join(", "),
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

        {formData.images && (
          <div className="upload-preview-grid">
            {formData.images
              .split(",")
              .map((image) => image.trim())
              .filter(Boolean)
              .map((image, index) => (
                <div key={`${image}-${index}`} className="upload-preview-item">
                  <img src={image} alt={`Gallery preview ${index + 1}`} />

                  <button
                    type="button"
                    onClick={() => {
                      const remainingImages = formData.images
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean)
                        .filter((_, itemIndex) => itemIndex !== index);

                      setFormData((prev) => ({
                        ...prev,
                        images: remainingImages.join(", "),
                      }));
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="admin-form-group">
        <label htmlFor="videoUrl">Video URL</label>
        <input
          id="videoUrl"
          type="text"
          placeholder="YouTube, Vimeo, or video link"
          value={formData.videoUrl}
          onChange={handleChange}
        />
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
      </div>

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

      <div className="admin-form-actions">
        <button type="submit" className="admin-primary-button">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export type { ProjectFormData };
export default ProjectForm;
