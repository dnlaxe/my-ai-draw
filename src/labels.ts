import type { DrawTopic } from "./drawBank";

export type UserLabel = DrawTopic | "other";

export const MIN_TOTAL = 8;
export const MIN_YES = 2;
export const MIN_NO = 2;

export function countLabels(
  labeled: Record<string, UserLabel>,
  target: DrawTopic,
) {
  const values = Object.values(labeled);
  const positive = values.filter((label) => label === target).length;
  const negative = values.filter((label) => label === "other").length;
  return { positive, negative, total: values.length };
}

export function canStartTraining(
  labeled: Record<string, UserLabel>,
  target: DrawTopic,
) {
  const { positive, negative, total } = countLabels(labeled, target);
  return total >= MIN_TOTAL && positive >= MIN_YES && negative >= MIN_NO;
}

export type Prompt = {
  label: UserLabel;
  instruction: string;
};

export function getNextPrompt(
  labeled: Record<string, UserLabel>,
  target: DrawTopic,
  targetName: string,
): Prompt | null {
  const { positive, negative, total } = countLabels(labeled, target);

  if (positive < MIN_YES) {
    return {
      label: target,
      instruction: `Draw a ${targetName.toLowerCase()}`,
    };
  }

  if (negative < MIN_NO) {
    return {
      label: "other",
      instruction: `Draw something that is not a ${targetName.toLowerCase()}`,
    };
  }

  if (total < MIN_TOTAL) {
    if (positive <= negative) {
      return {
        label: target,
        instruction: `Draw another ${targetName.toLowerCase()}`,
      };
    }
    return {
      label: "other",
      instruction: `Draw another doodle that is not a ${targetName.toLowerCase()}`,
    };
  }

  return null;
}

export function trainingClassLabels(target: DrawTopic): UserLabel[] {
  return [target, "other"];
}
