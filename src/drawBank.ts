export type DrawTopic = "cat" | "house" | "tree" | "sun" | "star" | "smiley";

export const ALL_TOPICS: DrawTopic[] = [
  "cat",
  "house",
  "tree",
  "sun",
  "star",
  "smiley",
];

export const MAX_TOPICS = 3;

export const LABEL_DISPLAY: Record<DrawTopic, string> = {
  cat: "Cat",
  house: "House",
  tree: "Tree",
  sun: "Sun",
  star: "Star",
  smiley: "Smiley face",
};
