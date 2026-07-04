import type { DrawTopic } from "./drawBank";
import {
  pickLabelNeedMorePhrase,
  pickLabelPromptMoreOtherPhrase,
  pickLabelPromptMoreTargetPhrase,
  pickLabelPromptOtherPhrase,
  pickLabelPromptTargetPhrase,
  pickLabelReadyPhrase,
} from "./copy/phrases";

export type UserLabel = DrawTopic | "other";

export const MIN_YES = 4;
export const MIN_NO = 4;
export const MIN_TOTAL = MIN_YES + MIN_NO;

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
  const { positive, negative } = countLabels(labeled, target);
  return positive >= MIN_YES && negative >= MIN_NO;
}

export type Prompt = {
  label: UserLabel;
  instruction: string;
};

function getBalancedFollowUpPrompt(
  positive: number,
  negative: number,
  target: DrawTopic,
  targetName: string,
): Prompt {
  if (positive <= negative) {
    return {
      label: target,
      instruction: pickLabelPromptMoreTargetPhrase(targetName),
    };
  }

  return {
    label: "other",
    instruction: pickLabelPromptMoreOtherPhrase(targetName),
  };
}

export function getNextPrompt(
  labeled: Record<string, UserLabel>,
  target: DrawTopic,
  targetName: string,
  options?: { keepAdding?: boolean },
): Prompt | null {
  const { positive, negative, total } = countLabels(labeled, target);

  if (positive < MIN_YES) {
    return {
      label: target,
      instruction: pickLabelPromptTargetPhrase(targetName),
    };
  }

  if (negative < MIN_NO) {
    return {
      label: "other",
      instruction: pickLabelPromptOtherPhrase(targetName),
    };
  }

  if (total < MIN_TOTAL) {
    return getBalancedFollowUpPrompt(positive, negative, target, targetName);
  }

  if (!options?.keepAdding) {
    return null;
  }

  return getBalancedFollowUpPrompt(positive, negative, target, targetName);
}

export function trainingClassLabels(target: DrawTopic): UserLabel[] {
  return [target, "other"];
}

export function getTrainingStatusMessage(
  labeled: Record<string, UserLabel>,
  target: DrawTopic,
  targetName: string,
  options?: { keepAdding?: boolean },
): string {
  if (canStartTraining(labeled, target)) {
    return pickLabelReadyPhrase(Boolean(options?.keepAdding));
  }

  const { positive, negative } = countLabels(labeled, target);
  const needs: string[] = [];
  if (positive < MIN_YES) {
    const missing = MIN_YES - positive;
    needs.push(
      `${missing} more ${targetName.toLowerCase()} doodle${missing === 1 ? "" : "s"}`,
    );
  }
  if (negative < MIN_NO) {
    const missing = MIN_NO - negative;
    needs.push(`${missing} more other doodle${missing === 1 ? "" : "s"}`);
  }
  return pickLabelNeedMorePhrase(needs);
}
