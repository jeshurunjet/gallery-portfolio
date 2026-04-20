import { useState } from "react";

type ImageGalleryProps = {
  images: string[];
  title: string;
};

function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(images[0]);

  return (
    <div className="image-gallery">
      <div className="image-gallery-main">
        <img src={selectedImage} alt={title} />
      </div>

      {images.length > 1 && (
        <div className="image-gallery-thumbs">
          {images.map((image, index) => (
            <button
              key={index}
              className={`thumb-button ${selectedImage === image ? "active" : ""}`}
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
