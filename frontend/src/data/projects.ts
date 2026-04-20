export type Project = {
  id: number;
  title: string;
  cover: string;
  category: string;
  likes: number;
  views: number;
  types: string[];
  description: string;
  tags: string[];
  images: string[];
  videoUrl?: string;
};
export const projects: Project[] = [
  {
    id: 1,
    title: "Photography Series",
    cover: "https://via.placeholder.com/1200x800?text=Photo+1",
    category: "Photography",
    likes: 120,
    views: 540,
    types: ["image"],
    description:
      "A curated photography series exploring light, texture, and portrait composition.",
    tags: ["photography", "editorial", "portrait"],
    images: [
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200",
      "https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=1200",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200",
    ],
  },
  {
    id: 2,
    title: "UI Design Project",
    cover: "https://via.placeholder.com/1200x800?text=UI+1",
    category: "Design",
    likes: 89,
    views: 300,
    types: ["image", "web"],
    description:
      "A web interface design project focused on clean layout, usability, and responsive structure.",
    tags: ["ui", "ux", "web", "figma"],
    images: [
      "https://placehold.co/1200x800?text=UI+Design+1",
      "https://placehold.co/1200x800?text=UI+Design+2",
      "https://placehold.co/1200x800?text=UI+Design+3",
    ],
  },
  {
    id: 3,
    title: "Machine Learning Model",
    cover: "https://via.placeholder.com/1200x800?text=ML+Preview",
    category: "Machine Learning",
    likes: 45,
    views: 200,
    types: ["code", "pdf"],
    description:
      "A machine learning project with supporting code, experiment notes, and project documentation.",
    tags: ["machine-learning", "python", "classification"],
    images: ["https://via.placeholder.com/1200x800?text=ML+Preview"],
  },
  {
    id: 4,
    title: "Music Production",
    cover: "https://via.placeholder.com/1200x800?text=Audio+Cover",
    category: "Audio",
    likes: 60,
    views: 250,
    types: ["audio"],
    description:
      "An audio design and music production project showcasing composition and sound design work.",
    tags: ["audio", "sound-design", "music"],
    images: ["https://via.placeholder.com/1200x800?text=Audio+Cover"],
  },
  {
    id: 2,
    title: "UI Design Demo",
    cover:
      "https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=1200",
    category: "Design",
    likes: 89,
    views: 300,
    types: ["video", "web"],
    description:
      "A UI walkthrough showing layout, responsiveness, and interactions.",
    tags: ["ui", "ux", "web"],
    images: [
      "https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=1200",
    ],
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
];
