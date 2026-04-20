type PdfViewerProps = {
  url: string;
};

function PdfViewer({ url }: PdfViewerProps) {
  return (
    <div className="pdf-viewer">
      <iframe src={url} title="Project PDF" />
      <a href={url} target="_blank" rel="noreferrer" className="pdf-open-link">
        Open PDF in new tab
      </a>
    </div>
  );
}

export default PdfViewer;
