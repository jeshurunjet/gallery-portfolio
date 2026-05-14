function LoadingPage({ progress }: { progress: number }) {
  return (
    <div className="loading-page">
      <div className="loading-card">
        <div className="loading-logo">JS</div>

        <h2>Loading Portfolio</h2>

        <p>Waking up backend services...</p>

        <div className="loading-progress">
          <div
            className="loading-progress-fill"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <span>{progress}%</span>
      </div>
    </div>
  );
}

export default LoadingPage;
