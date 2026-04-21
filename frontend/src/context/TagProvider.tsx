import { useMemo, useState } from "react";
import { projects } from "../data/projects";
import { TagContext } from "./tag-context";

function TagProvider({ children }: { children: React.ReactNode }) {
  const initialTags = useMemo(() => {
    const allTags = projects.flatMap((project) => project.tags);
    return [...new Set(allTags)].sort();
  }, []);

  const [tags, setTags] = useState<string[]>(initialTags);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();

    if (!trimmedTag) return;

    setTags((prev) =>
      prev.includes(trimmedTag) ? prev : [...prev, trimmedTag].sort()
    );
  };

  const updateTag = (oldTag: string, newTag: string) => {
    const trimmedNewTag = newTag.trim().toLowerCase();

    if (!trimmedNewTag) return;

    setTags((prev) =>
      prev.map((tag) => (tag === oldTag ? trimmedNewTag : tag)).sort()
    );
  };

  const deleteTag = (tagToDelete: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToDelete));
  };

  return (
    <TagContext.Provider value={{ tags, addTag, updateTag, deleteTag }}>
      {children}
    </TagContext.Provider>
  );
}

export default TagProvider;
