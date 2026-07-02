export type Screen = "home" | "pick" | "label" | "train" | "test";

export type Navigate = (screen: Screen) => void;
