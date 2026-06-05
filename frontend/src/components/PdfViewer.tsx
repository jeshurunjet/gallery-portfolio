type PdfViewerProps = {
  url: string;
};

function PdfViewer({ url }: PdfViewerProps) {
  return (
    <div className="pdf-viewer">
      <object data={url} type="application/pdf" aria-label="Project PDF">
        <p>
          This PDF preview is unavailable in your browser.
          <a href={url} target="_blank" rel="noreferrer">
            Open PDF in a new tab
          </a>
        </p>
      </object>
      <a href={url} target="_blank" rel="noreferrer" className="pdf-open-link">
        Open PDF in new tab
      </a>
    </div>
  );
}

export default PdfViewer;
