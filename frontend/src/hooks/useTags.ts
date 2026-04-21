import { useContext } from "react";
import { TagContext } from "../context/tag-context";

function useTags() {
  const context = useContext(TagContext);

  if (!context) {
    throw new Error("useTags must be used within TagProvider");
  }

  return context;
}

export default useTags;
