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
      "https://via.placeholder.com/1200x800?text=Photo+1",
      "https://via.placeholder.com/1200x800?text=Photo+2",
      "https://via.placeholder.com/1200x800?text=Photo+3",
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
      "https://via.placeholder.com/1200x800?text=UI+1",
      "https://via.placeholder.com/1200x800?text=UI+2",
      "https://via.placeholder.com/1200x800?text=UI+3",
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
];
