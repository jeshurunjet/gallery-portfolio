import { useEffect, useState } from "react";
import type { GalleryImage } from "../data/projects";

type ImageGalleryProps = {
  images?: GalleryImage[];
  autoScroll?: boolean;
  showThumbnails?: boolean;
  title: string;
};

function ImageGallery({
  images,
  autoScroll = true,
  showThumbnails = true,
  title,
}: ImageGalleryProps) {
  const safeImages = images ?? [];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const activeImage = safeImages[selectedIndex] ?? safeImages[0] ?? null;

  const goToNextImage = () => {
    setSelectedIndex((current) => (current + 1) % safeImages.length);
  };

  const goToPreviousImage = () => {
    setSelectedIndex((current) =>
      (current - 1 + safeImages.length) % safeImages.length
    );
  };

  useEffect(() => {
    if (!autoScroll || safeImages.length <= 1) return;

    const interval = window.setInterval(() => {
      setSelectedIndex((current) => (current + 1) % safeImages.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [autoScroll, safeImages.length]);

  useEffect(() => {
    if (selectedIndex <= safeImages.length - 1) return;
    setSelectedIndex(0);
  }, [safeImages.length, selectedIndex]);

  if (safeImages.length === 0 || !activeImage?.url) {
    return <div className="image-gallery">No images available.</div>;
  }

  const activeMode = activeImage.mode ?? "default";

  const getFrameAspectRatio = (image: GalleryImage) => {
    const mode = image.mode ?? "default";
    const baseHeight = mode === "header" ? 5 : 9;
    const frameScale = Math.max(35, Math.min(100, image.frameHeight ?? 100));
    return `16 / ${(baseHeight * frameScale) / 100}`;
  };

  const getMaskedStyle = (image: GalleryImage) => {
    const imageHeight = Math.max(100, Math.min(220, image.imageHeight ?? 100));
    const offsetX = Math.max(-50, Math.min(50, image.offsetX ?? 0));
    const offsetY = Math.max(-50, Math.min(50, image.offsetY ?? 0));
    return {
      width: "100%",
      height: `${imageHeight}%`,
      maxWidth: "none",
      left: `${50 + offsetX}%`,
      top: `${50 + offsetY}%`,
      transform: "translate(-50%, -50%)",
    };
  };

  return (
    <div className="image-gallery">
      <div
        className={`image-gallery-main image-gallery-main--${activeMode}`}
        style={{ aspectRatio: getFrameAspectRatio(activeImage) }}
        onTouchStart={(event) => {
          setTouchStartX(event.changedTouches[0]?.clientX ?? null);
        }}
        onTouchEnd={(event) => {
          if (touchStartX === null) return;

          const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
          const swipeDistance = touchStartX - touchEndX;

          if (swipeDistance > 50) {
            goToNextImage();
          } else if (swipeDistance < -50) {
            goToPreviousImage();
          }

          setTouchStartX(null);
        }}
      >
        <img
          src={activeImage.url}
          alt={title}
          style={getMaskedStyle(activeImage)}
        />
      </div>

      {showThumbnails && safeImages.length > 1 && (
        <div className="image-gallery-thumbs">
          {safeImages.map((image, index) => (
            <button
              key={index}
              className={`thumb-button ${
                selectedIndex === index ? "active" : ""
              }`}
              onClick={() => setSelectedIndex(index)}
              type="button"
              style={{ aspectRatio: getFrameAspectRatio(image) }}
            >
              <img
                src={image.url}
                alt={`${title} ${index + 1}`}
                style={getMaskedStyle(image)}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageGallery;
