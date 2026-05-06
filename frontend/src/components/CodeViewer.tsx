type CodeViewerProps = {
  code: string;
  language?: string;
};

function CodeViewer({ code, language = "code" }: CodeViewerProps) {
  return (
    <div className="code-viewer">
      <div className="code-viewer-header">
        <span>{language}</span>
        <span className="code-viewer-dot-group">
          <span />
          <span />
          <span />
        </span>
      </div>

      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default CodeViewer;
