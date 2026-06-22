import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";

function ProjectVideoNodeView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  return (
    <NodeViewWrapper className="tiptap-embedded-block">
      <div className="tiptap-embedded-block-header">
        <strong>Video Block</strong>
        <button type="button" onClick={() => deleteNode()}>
          Remove
        </button>
      </div>
      <div className="tiptap-embedded-grid">
        <input
          value={String(node.attrs.url ?? "")}
          onChange={(event) => updateAttributes({ url: event.target.value })}
          placeholder="Video URL"
        />
        <input
          value={String(node.attrs.caption ?? "")}
          onChange={(event) => updateAttributes({ caption: event.target.value })}
          placeholder="Caption"
        />
      </div>
      {node.attrs.url ? (
        <video
          className="content-image content-media-video"
          src={String(node.attrs.url)}
          controls
          muted
          playsInline
        />
      ) : null}
    </NodeViewWrapper>
  );
}

export const ProjectVideo = Node.create({
  name: "projectVideo",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      url: { default: "" },
      caption: { default: "" },
      publicId: { default: null },
      tempId: { default: null },
      uploadStatus: { default: "uploaded" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="project-video"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "project-video" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ProjectVideoNodeView);
  },
});
