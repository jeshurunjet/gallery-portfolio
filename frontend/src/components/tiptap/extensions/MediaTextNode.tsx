import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";

function MediaTextNodeView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  return (
    <NodeViewWrapper className="tiptap-embedded-block">
      <div className="tiptap-embedded-block-header">
        <strong>Media + Text Block</strong>
        <button type="button" onClick={() => deleteNode()}>
          Remove
        </button>
      </div>
      <div className="tiptap-embedded-grid">
        <select
          value={String(node.attrs.layout ?? "image-left")}
          onChange={(event) => updateAttributes({ layout: event.target.value })}
        >
          <option value="image-left">Image Left</option>
          <option value="image-right">Image Right</option>
          <option value="image-text-image">Image Text Image</option>
          <option value="image-image">Image Image</option>
        </select>
        <select
          value={String(node.attrs.mediaType ?? "image")}
          onChange={(event) => updateAttributes({ mediaType: event.target.value })}
        >
          <option value="image">Image</option>
          <option value="video">Video</option>
        </select>
        <select
          value={String(node.attrs.align ?? "left")}
          onChange={(event) => updateAttributes({ align: event.target.value })}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
          <option value="justify">Justify</option>
        </select>
      </div>
      <input
        value={String(node.attrs.imageUrl ?? "")}
        onChange={(event) => updateAttributes({ imageUrl: event.target.value })}
        placeholder="Primary media URL"
      />
      <input
        value={String(node.attrs.imageAlt ?? "")}
        onChange={(event) => updateAttributes({ imageAlt: event.target.value })}
        placeholder="Primary media alt"
      />
      <textarea
        rows={5}
        value={String(node.attrs.text ?? "")}
        onChange={(event) => updateAttributes({ text: event.target.value })}
        placeholder="Text content"
      />
      {(node.attrs.layout === "image-text-image" ||
        node.attrs.layout === "image-image") && (
        <>
          <input
            value={String(node.attrs.imageUrlRight ?? "")}
            onChange={(event) =>
              updateAttributes({ imageUrlRight: event.target.value })
            }
            placeholder="Right image URL"
          />
          <input
            value={String(node.attrs.imageAltRight ?? "")}
            onChange={(event) =>
              updateAttributes({ imageAltRight: event.target.value })
            }
            placeholder="Right image alt"
          />
        </>
      )}
    </NodeViewWrapper>
  );
}

export const MediaTextNode = Node.create({
  name: "mediaText",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      layout: { default: "image-left" },
      mediaType: { default: "image" },
      text: { default: "" },
      imageUrl: { default: "" },
      imageAlt: { default: "" },
      imageUrlRight: { default: "" },
      imageAltRight: { default: "" },
      publicId: { default: null },
      publicIdRight: { default: null },
      align: { default: "left" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="media-text"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "media-text" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MediaTextNodeView);
  },
});
