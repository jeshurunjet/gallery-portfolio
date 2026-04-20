export type ProjectContentBlock =
  | { type: "heading"; text: string }
  | { type: "subheading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "image"; url: string; alt: string }
  | { type: "list"; items: string[] }
  | { type: "divider" }
  | {
      type: "references";
      items: { label: string; value: string }[];
    };

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
  audioUrl?: string;
  pdfUrl?: string;
  codeContent?: string;
  content?: ProjectContentBlock[];
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
    content: [
      {
        type: "heading",
        text: "Overview",
      },
      {
        type: "paragraph",
        text: "This project explores the visual direction, layout, and interaction design of a modern interface concept.",
      },
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=1200",
        alt: "UI project preview",
      },
      {
        type: "heading",
        text: "Process",
      },
      {
        type: "paragraph",
        text: "I started with layout exploration, then refined the hierarchy, spacing, and visual system to create a cleaner user experience.",
      },
    ],
    liveUrl: "https://example.com",
    externalUrl: "https://www.figma.com/",
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
    content: [
      {
        type: "heading",
        text: "Overview",
      },
      {
        type: "paragraph",
        text: "This project explores the visual direction, layout, and interaction design of a modern interface concept.",
      },
      {
        type: "subheading",
        text: "Design Direction",
      },
      {
        type: "paragraph",
        text: "I focused on cleaner spacing, stronger hierarchy, and a more minimal visual system to improve readability.",
      },
      {
        type: "quote",
        text: "The goal was to make the interface feel calm, modern, and easy to navigate.",
      },
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=1200",
        alt: "UI project preview",
      },
      {
        type: "subheading",
        text: "Process",
      },
      {
        type: "paragraph",
        text: "This project focuses on **usability**, **clarity**, and **performance**.",
      },
      {
        type: "paragraph",
        text: "This project focuses on **clarity**, *motion*, and __hierarchy__ across the full user journey.",
      },
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
    content: [
      {
        type: "heading",
        text: "Overview",
      },
      {
        type: "paragraph",
        text: "This project focuses on **clarity**, *motion*, and __hierarchy__ across the full user journey.",
      },
      {
        type: "subheading",
        text: "Key Contributions",
      },
      {
        type: "list",
        items: [
          "Designed the overall layout and visual structure",
          "Refined spacing and typography hierarchy",
          "Created a responsive interface concept",
          "Documented the design process and rationale",
        ],
      },
      {
        type: "quote",
        text: "The goal was to make the interface feel calm, modern, and easy to navigate.",
      },
      {
        type: "divider",
      },
      {
        type: "subheading",
        text: "Visual Direction",
      },
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=1200",
        alt: "UI project preview",
      },
      {
        type: "references",
        items: [
          {
            label: "Dataset",
            value: "Kaggle Stroke Prediction Dataset",
          },
          {
            label: "Library",
            value: "Scikit-learn LogisticRegression",
          },
          {
            label: "Research",
            value: "Lecture materials and course notes",
          },
        ],
      },
    ],
    facts: {
      role: "Designer & Developer",
      year: "2026",
      tools: ["React", "Figma", "Python"],
      category: "UI / Machine Learning",
    },
    liveUrl: "https://example.com",
    githubUrl: "https://github.com/yourusername/project-name",
    externalUrl: "https://www.figma.com/",
  },
  {
    id: 5,
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
    githubUrl: "https://github.com/yourusername/project-name",
  },
  {
    id: 6,
    title: "Ambient Sound Design",
    cover:
      "https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=1200",
    category: "Audio",
    likes: 70,
    views: 180,
    types: ["audio"],
    description:
      "A collection of ambient textures and sound design experiments.",
    tags: ["audio", "sound-design"],
    images: [
      "https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=1200",
    ],
    audioUrl: "https://soundcloud.com/forss/flickermood",
  },
  {
    id: 7,
    title: "Deep Learning Report",
    cover:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200",
    category: "Deep Learning",
    likes: 52,
    views: 210,
    types: ["pdf"],
    description:
      "A deep learning project report with methodology, experiments, and results.",
    tags: ["deep-learning", "pdf", "research"],
    images: [
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200",
    ],
    pdfUrl: "/pdfs/sample-report.pdf",
  },
  {
    id: 8,
    title: "Logistic Regression Model",
    cover:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
    category: "Machine Learning",
    likes: 80,
    views: 260,
    types: ["code"],
    description: "A logistic regression model for stroke prediction.",
    tags: ["machine-learning", "python"],
    images: [
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
    ],
    codeContent: `
import pandas as pd
from sklearn.linear_model import LogisticRegression

model = LogisticRegression(max_iter=1000)
model.fit(X_train, y_train)

predictions = model.predict(X_test)
`,
  },
];
