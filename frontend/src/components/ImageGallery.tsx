import { useState } from "react";

type ImageGalleryProps = {
  images?: string[];
  title: string;
};

function ImageGallery({ images, title }: ImageGalleryProps) {
  const safeImages = images ?? [];
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const activeImage = selectedImage ?? safeImages[0] ?? null;

  if (safeImages.length === 0 || !activeImage) {
    return <div className="image-gallery">No images available.</div>;
  }

  return (
    <div className="image-gallery">
      <div className="image-gallery-main">
        <img src={activeImage} alt={title} />
      </div>

      {safeImages.length > 1 && (
        <div className="image-gallery-thumbs">
          {safeImages.map((image, index) => (
            <button
              key={index}
              className={`thumb-button ${
                activeImage === image ? "active" : ""
              }`}
              onClick={() => setSelectedImage(image)}
              type="button"
            >
              <img src={image} alt={`${title} ${index + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageGallery;
