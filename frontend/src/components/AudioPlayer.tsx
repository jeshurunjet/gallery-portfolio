type AudioPlayerProps = {
  url: string;
};

function getSoundCloudEmbed(url: string) {
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(
    url
  )}&color=%23111111&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false`;
}

function AudioPlayer({ url }: AudioPlayerProps) {
  const embedUrl = getSoundCloudEmbed(url);

  return (
    <div className="audio-player">
      <iframe src={embedUrl} title="SoundCloud player" allow="autoplay" />
    </div>
  );
}

export default AudioPlayer;
