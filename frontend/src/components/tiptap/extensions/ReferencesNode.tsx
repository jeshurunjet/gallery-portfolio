import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";

type ReferenceItem = {
  label: string;
  value: string;
};

function normalizeItems(value: unknown): ReferenceItem[] {
  return Array.isArray(value)
    ? value.map((item) => ({
        label: typeof item?.label === "string" ? item.label : "",
        value: typeof item?.value === "string" ? item.value : "",
      }))
    : [];
}

function ReferencesNodeView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const items = normalizeItems(node.attrs.items);

  const updateItem = (index: number, next: ReferenceItem) => {
    const updated = items.map((item, itemIndex) =>
      itemIndex === index ? next : item
    );
    updateAttributes({ items: updated });
  };

  return (
    <NodeViewWrapper className="tiptap-embedded-block">
      <div className="tiptap-embedded-block-header">
        <strong>References Block</strong>
        <button type="button" onClick={() => deleteNode()}>
          Remove
        </button>
      </div>
      <div className="tiptap-embedded-stack">
        {items.map((item, index) => (
          <div key={`${item.label}-${index}`} className="tiptap-embedded-grid">
            <input
              value={item.label}
              onChange={(event) =>
                updateItem(index, { ...item, label: event.target.value })
              }
              placeholder="Label"
            />
            <input
              value={item.value}
              onChange={(event) =>
                updateItem(index, { ...item, value: event.target.value })
              }
              placeholder="Value"
            />
          </div>
        ))}
        <button
          type="button"
          className="tiptap-add-inline-button"
          onClick={() =>
            updateAttributes({
              items: [...items, { label: "", value: "" }],
            })
          }
        >
          Add reference
        </button>
      </div>
    </NodeViewWrapper>
  );
}

export const ReferencesNode = Node.create({
  name: "references",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      items: { default: [] },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="references"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "references" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ReferencesNodeView);
  },
});
