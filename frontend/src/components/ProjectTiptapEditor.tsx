import { useEffect, useRef } from "react";
import {
  EditorContent,
  useEditor,
  type JSONContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
  Video,
  Columns2,
  Rows3,
} from "lucide-react";
import { MediaTextNode } from "./tiptap/extensions/MediaTextNode";
import { ProjectVideo } from "./tiptap/extensions/ProjectVideo";
import { ReferencesNode } from "./tiptap/extensions/ReferencesNode";
import { TwoColumnNode } from "./tiptap/extensions/TwoColumnNode";

type ProjectTiptapEditorProps = {
  value: JSONContent;
  onChange: (value: JSONContent) => void;
  onNotify?: (message: string) => void;
  disabled?: boolean;
  hasPendingUploads?: boolean;
  stageImage: (file: File) => { tempId: string; previewUrl: string };
  stageVideo: (file: File) => { tempId: string; previewUrl: string };
};

const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [],
};

function isSameJson(left: JSONContent, right: JSONContent) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function ProjectTiptapEditor({
  value,
  onChange,
  onNotify,
  disabled = false,
  hasPendingUploads = false,
  stageImage,
  stageVideo,
}: ProjectTiptapEditorProps) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image.extend({
        addAttributes() {
          return {
            src: { default: "" },
            alt: { default: "" },
            publicId: { default: null },
            caption: { default: "" },
            tempId: { default: null },
            uploadStatus: { default: "uploaded" },
          };
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      Placeholder.configure({
        placeholder: "Write project body content...",
      }),
      HorizontalRule,
      ProjectVideo,
      TwoColumnNode,
      MediaTextNode,
      ReferencesNode,
    ],
    content: value?.type === "doc" ? value : EMPTY_DOC,
    onUpdate: ({ editor: nextEditor }) => {
      onChange(nextEditor.getJSON());
    },
  });

  useEffect(() => {
    if (!editor) return;

    const nextValue = value?.type === "doc" ? value : EMPTY_DOC;
    const currentValue = editor.getJSON();

    if (!isSameJson(currentValue, nextValue)) {
      editor.commands.setContent(nextValue, { emitUpdate: false });
    }
  }, [editor, value]);

  const insertLink = () => {
    if (!editor) return;

    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", previous ?? "");

    if (url === null) return;

    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const insertTwoColumn = () => {
    editor?.chain().focus().insertContent({
      type: "twoColumn",
      attrs: {
        left: "",
        right: "",
        align: "left",
      },
    }).run();
  };

  const insertMediaText = () => {
    editor?.chain().focus().insertContent({
      type: "mediaText",
      attrs: {
        layout: "image-left",
        mediaType: "image",
        text: "",
        imageUrl: "",
        imageAlt: "",
        imageUrlRight: "",
        imageAltRight: "",
        publicId: null,
        publicIdRight: null,
        align: "left",
      },
    }).run();
  };

  const insertReferences = () => {
    editor?.chain().focus().insertContent({
      type: "references",
      attrs: {
        items: [{ label: "", value: "" }],
      },
    }).run();
  };

  const insertVideoUrl = () => {
    if (!editor) return;

    const url = window.prompt("Enter video URL");
    if (!url?.trim()) return;

    editor.chain().focus().insertContent({
      type: "projectVideo",
      attrs: {
        url: url.trim(),
        caption: "",
        publicId: null,
        tempId: null,
        uploadStatus: "uploaded",
      },
    }).run();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !editor) return;

    try {
      const result = stageImage(file);
      editor
        .chain()
        .focus()
        .insertContent({
          type: "image",
          attrs: {
            src: result.previewUrl,
            alt: file.name,
            publicId: null,
            tempId: result.tempId,
            uploadStatus: "pending",
          },
        })
        .run();
      onNotify?.("Image added. It will upload when you save.");
    } catch (error) {
      console.error(error);
      onNotify?.("Image preview failed.");
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !editor) return;

    try {
      const result = stageVideo(file);
      editor.chain().focus().insertContent({
        type: "projectVideo",
        attrs: {
          url: result.previewUrl,
          publicId: null,
          caption: file.name,
          tempId: result.tempId,
          uploadStatus: "pending",
        },
      }).run();
      onNotify?.("Video added. It will upload when you save.");
    } catch (error) {
      console.error(error);
      onNotify?.("Video preview failed.");
    }
  };

  return (
    <div className="tiptap-editor-shell">
      <div className="tiptap-toolbar">
        <button
          type="button"
          title="Bold"
          aria-label="Bold"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={editor?.isActive("bold") ? "active" : ""}
          disabled={disabled}
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          title="Italic"
          aria-label="Italic"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={editor?.isActive("italic") ? "active" : ""}
          disabled={disabled}
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          title="Underline"
          aria-label="Underline"
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          className={editor?.isActive("underline") ? "active" : ""}
          disabled={disabled}
        >
          <UnderlineIcon size={16} />
        </button>
        <button
          type="button"
          title="Bullet List"
          aria-label="Bullet List"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={editor?.isActive("bulletList") ? "active" : ""}
          disabled={disabled}
        >
          <List size={16} />
        </button>
        <button
          type="button"
          title="Numbered List"
          aria-label="Numbered List"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={editor?.isActive("orderedList") ? "active" : ""}
          disabled={disabled}
        >
          <ListOrdered size={16} />
        </button>
        <button
          type="button"
          title="Quote"
          aria-label="Quote"
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          className={editor?.isActive("blockquote") ? "active" : ""}
          disabled={disabled}
        >
          <Quote size={16} />
        </button>
        <button
          type="button"
          title="Align Left"
          aria-label="Align Left"
          onClick={() => editor?.chain().focus().setTextAlign("left").run()}
          className={editor?.isActive({ textAlign: "left" }) ? "active" : ""}
          disabled={disabled}
        >
          <AlignLeft size={16} />
        </button>
        <button
          type="button"
          title="Align Center"
          aria-label="Align Center"
          onClick={() => editor?.chain().focus().setTextAlign("center").run()}
          className={editor?.isActive({ textAlign: "center" }) ? "active" : ""}
          disabled={disabled}
        >
          <AlignCenter size={16} />
        </button>
        <button
          type="button"
          title="Align Right"
          aria-label="Align Right"
          onClick={() => editor?.chain().focus().setTextAlign("right").run()}
          className={editor?.isActive({ textAlign: "right" }) ? "active" : ""}
          disabled={disabled}
        >
          <AlignRight size={16} />
        </button>
        <button
          type="button"
          title="Justify Text"
          aria-label="Justify Text"
          onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
          className={editor?.isActive({ textAlign: "justify" }) ? "active" : ""}
          disabled={disabled}
        >
          <AlignJustify size={16} />
        </button>
        <button
          type="button"
          title="Add Link"
          aria-label="Add Link"
          onClick={insertLink}
          disabled={disabled}
        >
          <Link2 size={16} />
        </button>
        <button
          type="button"
          title="Divider"
          aria-label="Divider"
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          disabled={disabled}
        >
          <Minus size={16} />
        </button>
        <button
          type="button"
          title="Upload Image"
          aria-label="Upload Image"
          onClick={() => imageInputRef.current?.click()}
          disabled={disabled || hasPendingUploads}
        >
          <ImageIcon size={16} />
        </button>
        <button
          type="button"
          title="Upload Video"
          aria-label="Upload Video"
          onClick={() => videoInputRef.current?.click()}
          disabled={disabled || hasPendingUploads}
        >
          <Video size={16} />
        </button>
        <button
          type="button"
          title="Insert Video URL"
          aria-label="Insert Video URL"
          onClick={insertVideoUrl}
          disabled={disabled}
        >
          Video URL
        </button>
        <button
          type="button"
          title="Insert Two Column Block"
          aria-label="Insert Two Column Block"
          onClick={insertTwoColumn}
          disabled={disabled}
        >
          <Columns2 size={16} />
        </button>
        <button
          type="button"
          title="Insert Media and Text Block"
          aria-label="Insert Media and Text Block"
          onClick={insertMediaText}
          disabled={disabled}
        >
          Media + Text
        </button>
        <button
          type="button"
          title="Insert References Block"
          aria-label="Insert References Block"
          onClick={insertReferences}
          disabled={disabled}
        >
          <Rows3 size={16} />
        </button>
        <button
          type="button"
          title="Undo"
          aria-label="Undo"
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={disabled}
        >
          <Undo2 size={16} />
        </button>
        <button
          type="button"
          title="Redo"
          aria-label="Redo"
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={disabled}
        >
          <Redo2 size={16} />
        </button>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="media-dropzone-input"
        onChange={handleImageUpload}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/ogg"
        className="media-dropzone-input"
        onChange={handleVideoUpload}
      />

      <div className={`tiptap-editor-frame ${disabled ? "is-disabled" : ""}`}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export default ProjectTiptapEditor;
