type VideoPlayerProps = {
  url: string;
};

function getEmbedUrl(url: string) {
  const videoId = url.split("v=")[1];
  return `https://www.youtube.com/embed/${videoId}`;
}

function VideoPlayer({ url }: VideoPlayerProps) {
  const embedUrl = getEmbedUrl(url);

  return (
    <div className="video-player">
      <iframe
        src={embedUrl}
        title="Project video"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

export default VideoPlayer;
