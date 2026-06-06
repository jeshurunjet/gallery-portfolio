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

  const getMaskedStyle = (image: GalleryImage) => {
    const axis = image.cropAxis ?? "vertical";
    const cropStart = Math.max(0, Math.min(35, image.cropStart ?? 0));
    const cropEnd = Math.max(0, Math.min(35, image.cropEnd ?? 0));
    const visibleFraction = Math.max(0.3, 1 - (cropStart + cropEnd) / 100);

    if (axis === "horizontal") {
      return {
        width: `${100 / visibleFraction}%`,
        height: "100%",
        maxWidth: "none",
        left: `-${(cropStart / visibleFraction).toFixed(4)}%`,
        top: "0",
      };
    }

    return {
      width: "100%",
      height: `${100 / visibleFraction}%`,
      maxWidth: "none",
      left: "0",
      top: `-${(cropStart / visibleFraction).toFixed(4)}%`,
    };
  };

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
