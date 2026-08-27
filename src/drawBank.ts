export type DrawTopic =
  | "cat"
  | "house"
  | "tree"
  | "sun"
  | "star"
  | "smiley"
  | "dog"
  | "fish"
  | "bird"
  | "flower"
  | "car"
  | "boat"
  | "cloud"
  | "moon"
  | "heart"
  | "apple"
  | "pizza"
  | "robot"
  | "dinosaur"
  | "rainbow";

export const ALL_TOPICS: DrawTopic[] = [
  "cat",
  "house",
  "tree",
  "sun",
  "star",
  "smiley",
  "dog",
  "fish",
  "bird",
  "flower",
  "car",
  "boat",
  "cloud",
  "moon",
  "heart",
  "apple",
  "pizza",
  "robot",
  "dinosaur",
  "rainbow",
];

export const MAX_TOPICS = 5;

export const LABEL_DISPLAY: Record<DrawTopic, string> = {
  cat: "Cat",
  house: "House",
  tree: "Tree",
  sun: "Sun",
  star: "Star",
  smiley: "Smiley face",
  dog: "Dog",
  fish: "Fish",
  bird: "Bird",
  flower: "Flower",
  car: "Car",
  boat: "Boat",
  cloud: "Cloud",
  moon: "Moon",
  heart: "Heart",
  apple: "Apple",
  pizza: "Pizza",
  robot: "Robot",
  dinosaur: "Dinosaur",
  rainbow: "Rainbow",
};
