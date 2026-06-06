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
  const activeObjectPosition = `${activeImage.objectPositionX ?? 50}% ${
    activeImage.objectPositionY ?? 50
  }%`;

  return (
    <div className="image-gallery">
      <div
        className={`image-gallery-main image-gallery-main--${activeMode}`}
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
          style={{ objectPosition: activeObjectPosition }}
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
            >
              <img
                src={image.url}
                alt={`${title} ${index + 1}`}
                style={{
                  objectPosition: `${image.objectPositionX ?? 50}% ${
                    image.objectPositionY ?? 50
                  }%`,
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageGallery;
