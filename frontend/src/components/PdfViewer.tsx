import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type PdfViewerProps = {
  url: string;
};

function PdfViewer({ url }: PdfViewerProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="pdf-viewer">
      <div className="pdf-viewer-toolbar">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="pdf-open-link"
        >
          Open PDF in new tab
        </a>

        <button
          type="button"
          className="pdf-toggle-button"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          {collapsed ? "Expand preview" : "Collapse preview"}
        </button>
      </div>

      {!collapsed && (
        <object data={url} type="application/pdf" aria-label="Project PDF">
          <p>
            This PDF preview is unavailable in your browser.
            <a href={url} target="_blank" rel="noreferrer">
              Open PDF in a new tab
            </a>
          </p>
        </object>
      )}
    </div>
  );
}

export default PdfViewer;
