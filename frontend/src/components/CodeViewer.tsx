type CodeViewerProps = {
  code: string;
};

function CodeViewer({ code }: CodeViewerProps) {
  return (
    <div className="code-viewer">
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default CodeViewer;
