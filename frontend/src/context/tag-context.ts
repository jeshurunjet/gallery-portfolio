import { createContext } from "react";

export type TagContextType = {
  tags: string[];
  addTag: (tag: string) => void;
  updateTag: (oldTag: string, newTag: string) => void;
  deleteTag: (tag: string) => void;
};

export const TagContext = createContext<TagContextType | undefined>(undefined);
