import { useState } from "react";
import { API_BASE_URL } from "../config";
import type { ProjectContentBlock } from "../data/projects";

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

function ProjectForm({
  initialData,
  submitLabel,
  onSubmit,
  onNotify,
}: ProjectFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>(initialData);

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

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    return response.text();
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(formData);
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

        <div className="content-editor-list">
          {formData.content?.length === 0 && (
            <div className="admin-empty-state">
              <p>
                No content blocks yet. Add paragraphs, images, quotes, and
                layouts above. Content blocks also support **bold**, *italic*,
                __underline__, bullet lists, numbered lists, and --- separators.
              </p>
            </div>
          )}

          {formData.content?.map((block, index) => (
            <div key={index} className="content-editor-card">
              <div className="content-editor-card-header">
                <p>
                  Block {index + 1}: <strong>{block.type}</strong>
                </p>

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

              {(block.type === "paragraph" || block.type === "quote") && (
                <textarea
                  rows={4}
                  placeholder={
                    block.type === "quote"
                      ? "Write quote text"
                      : "Write paragraph text"
                  }
                  value={block.text}
                  onChange={(e) => {
                    updateContentBlock(index, {
                      ...block,
                      text: e.target.value,
                    });
                  }}
                />
              )}

              {block.type === "paragraph" && (
                <select
                  value={block.align ?? "left"}
                  onChange={(e) => {
                    updateContentBlock(index, {
                      ...block,
                      align: e.target.value as TextAlignOption,
                    });
                  }}
                >
                  <option value="left">Left align</option>
                  <option value="center">Center align</option>
                  <option value="right">Right align</option>
                  <option value="justify">Justify</option>
                </select>
              )}

              {block.type === "image" && (
                <>
                  <input
                    placeholder="Image URL"
                    value={block.url}
                    onChange={(e) => {
                      updateContentBlock(index, {
                        ...block,
                        url: e.target.value,
                      });
                    }}
                  />

                  <input
                    placeholder="Image alt text"
                    value={block.alt}
                    onChange={(e) => {
                      updateContentBlock(index, {
                        ...block,
                        alt: e.target.value,
                      });
                    }}
                  />

                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
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
                      <img src={block.url} alt={block.alt || "Preview"} />

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
                  <select
                    value={block.align ?? "left"}
                    onChange={(e) => {
                      updateContentBlock(index, {
                        ...block,
                        align: e.target.value as TextAlignOption,
                      });
                    }}
                  >
                    <option value="left">Left align</option>
                    <option value="center">Center align</option>
                    <option value="right">Right align</option>
                    <option value="justify">Justify</option>
                  </select>

                  <textarea
                    rows={4}
                    placeholder="Left column text"
                    value={block.left}
                    onChange={(e) => {
                      updateContentBlock(index, {
                        ...block,
                        left: e.target.value,
                      });
                    }}
                  />

                  <textarea
                    rows={4}
                    placeholder="Right column text"
                    value={block.right}
                    onChange={(e) => {
                      updateContentBlock(index, {
                        ...block,
                        right: e.target.value,
                      });
                    }}
                  />
                </>
              )}

              {block.type === "mediaText" && (
                <>
                  <select
                    value={block.layout}
                    onChange={(e) => {
                      updateContentBlock(index, {
                        ...block,
                        layout: e.target.value as
                          | "image-left"
                          | "image-right"
                          | "image-text-image",
                      });
                    }}
                  >
                    <option value="image-left">Image left + text right</option>
                    <option value="image-right">Text left + image right</option>
                    <option value="image-text-image">
                      Image + text + image
                    </option>
                  </select>

                  <select
                    value={block.align ?? "left"}
                    onChange={(e) => {
                      updateContentBlock(index, {
                        ...block,
                        align: e.target.value as TextAlignOption,
                      });
                    }}
                  >
                    <option value="left">Left align</option>
                    <option value="center">Center align</option>
                    <option value="right">Right align</option>
                    <option value="justify">Justify</option>
                  </select>

                  <input
                    placeholder="Left/main image URL"
                    value={block.imageUrl}
                    onChange={(e) => {
                      updateContentBlock(index, {
                        ...block,
                        imageUrl: e.target.value,
                      });
                    }}
                  />

                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
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

                  <textarea
                    rows={5}
                    placeholder="Text beside image"
                    value={block.text}
                    onChange={(e) => {
                      updateContentBlock(index, {
                        ...block,
                        text: e.target.value,
                      });
                    }}
                  />

                  {block.layout === "image-text-image" && (
                    <>
                      <input
                        placeholder="Right image URL"
                        value={block.imageUrlRight ?? ""}
                        onChange={(e) => {
                          updateContentBlock(index, {
                            ...block,
                            imageUrlRight: e.target.value,
                          });
                        }}
                      />

                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
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
                            alt={block.imageAltRight || "Right media preview"}
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
          ))}
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
          onChange={async (e) => {
            const file = e.target.files?.[0];
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
          onChange={async (e) => {
            const files = e.target.files;
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
