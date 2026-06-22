import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";

function TwoColumnNodeView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  return (
    <NodeViewWrapper className="tiptap-embedded-block">
      <div className="tiptap-embedded-block-header">
        <strong>Two Column Block</strong>
        <button type="button" onClick={() => deleteNode()}>
          Remove
        </button>
      </div>
      <select
        value={String(node.attrs.align ?? "left")}
        onChange={(event) => updateAttributes({ align: event.target.value })}
      >
        <option value="left">Left</option>
        <option value="center">Center</option>
        <option value="right">Right</option>
        <option value="justify">Justify</option>
      </select>
      <div className="tiptap-embedded-columns">
        <textarea
          rows={5}
          value={String(node.attrs.left ?? "")}
          onChange={(event) => updateAttributes({ left: event.target.value })}
          placeholder="Left column"
        />
        <textarea
          rows={5}
          value={String(node.attrs.right ?? "")}
          onChange={(event) => updateAttributes({ right: event.target.value })}
          placeholder="Right column"
        />
      </div>
    </NodeViewWrapper>
  );
}

export const TwoColumnNode = Node.create({
  name: "twoColumn",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      left: { default: "" },
      right: { default: "" },
      align: { default: "left" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="two-column"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "two-column" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TwoColumnNodeView);
  },
});
