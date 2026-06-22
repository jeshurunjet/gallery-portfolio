import type { JSONContent } from "@tiptap/react";

export type GalleryImagePreset =
  | "original"
  | "landscape"
  | "portrait"
  | "square"
  | "header";

export type GalleryImage = {
  url: string;
  publicId?: string;
  mode?: GalleryImagePreset;
};

export type MediaAsset = {
  url: string;
  publicId?: string;
};

export type Project = {
  id: number;
  title: string;
  cover: string;
  coverDisplayMode?: "default" | "header";
  category: string;
  likes: number;
  views: number;
  pinned?: boolean;
  types: string[];
  tags: string[];
  images: string[];
  galleryImages?: GalleryImage[];
  galleryShowThumbnails?: boolean;
  galleryAutoScroll?: boolean;
  videos?: MediaAsset[];
  audios?: MediaAsset[];
  pdfs?: MediaAsset[];
  videoUrl?: string;
  audioUrl?: string;
  pdfUrl?: string;
  videoPublicId?: string;
  audioPublicId?: string;
  pdfPublicId?: string;
  coverPublicId?: string;
  imagesPublicIds?: string[];
  codeContent?: string;
  contentJson?: JSONContent | null;
  facts?: {
    role?: string;
    year?: string;
    tools?: string[];
    category?: string;
  };
  liveUrl?: string;
  githubUrl?: string;
  externalUrl?: string;
};
