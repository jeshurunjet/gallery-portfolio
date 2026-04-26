type VideoPlayerProps = {
  url: string;
};

function getEmbedUrl(url: string) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("youtube.com")) {
      const videoId = parsedUrl.searchParams.get("v");

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    if (parsedUrl.hostname.includes("youtu.be")) {
      const videoId = parsedUrl.pathname.slice(1);

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    if (parsedUrl.hostname.includes("vimeo.com")) {
      const videoId = parsedUrl.pathname.split("/").filter(Boolean)[0];

      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }

    return url;
  } catch {
    return "";
  }
}

function VideoPlayer({ url }: VideoPlayerProps) {
  const embedUrl = getEmbedUrl(url);

  if (!embedUrl) {
    return (
      <div className="empty-media">
        <p>Video could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="video-player">
      <iframe
        src={embedUrl}
        title="Project video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

export default VideoPlayer;
