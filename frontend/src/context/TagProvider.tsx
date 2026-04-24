import { useEffect, useState } from "react";
import { TagContext } from "./tag-context";
import useProjects from "../hooks/useProjects";

type Tag = {
  id: number;
  name: string;
};

function TagProvider({ children }: { children: React.ReactNode }) {
  const [tags, setTags] = useState<string[]>([]);
  const [tagMap, setTagMap] = useState<Record<string, number>>({});
  const { refreshProjects } = useProjects();

  useEffect(() => {
    fetch("http://localhost:8080/api/tags")
      .then((res) => res.json())
      .then((data: Tag[]) => {
        const names = data.map((t) => t.name);
        const map: Record<string, number> = {};

        data.forEach((t) => {
          map[t.name] = t.id;
        });

        setTags(names);
        setTagMap(map);
      })
      .catch((err) => console.error("Failed to fetch tags:", err));
  }, []);

  const addTag = async (tag: string) => {
    try {
      const response = await fetch("http://localhost:8080/api/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: tag }),
      });

      const created = await response.json();

      setTags((prev) => [...prev, created.name]);
      setTagMap((prev) => ({ ...prev, [created.name]: created.id }));
      await refreshProjects();
    } catch (err) {
      console.error("Failed to add tag:", err);
    }
  };

  const updateTag = async (oldTag: string, newTag: string) => {
    const id = tagMap[oldTag];
    if (!id) return;

    try {
      const response = await fetch(`http://localhost:8080/api/tags/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newTag }),
      });

      const updated = await response.json();

      setTags((prev) => prev.map((t) => (t === oldTag ? updated.name : t)));

      setTagMap((prev) => {
        const newMap = { ...prev };
        delete newMap[oldTag];
        newMap[updated.name] = updated.id;
        return newMap;
      });

      await refreshProjects();
    } catch (err) {
      console.error("Failed to update tag:", err);
    }
  };

  const deleteTag = async (tag: string) => {
    const id = tagMap[tag];
    if (!id) return;

    try {
      await fetch(`http://localhost:8080/api/tags/${id}`, {
        method: "DELETE",
      });

      setTags((prev) => prev.filter((t) => t !== tag));

      setTagMap((prev) => {
        const newMap = { ...prev };
        delete newMap[tag];
        return newMap;
      });

      await refreshProjects();
    } catch (err) {
      console.error("Failed to delete tag:", err);
    }
  };

  return (
    <TagContext.Provider value={{ tags, addTag, updateTag, deleteTag }}>
      {children}
    </TagContext.Provider>
  );
}

export default TagProvider;
