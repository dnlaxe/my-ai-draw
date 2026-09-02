import { fillTemplate, formatList, pickRandom } from "./phrasePicker";

const HOME_EMPTY_PHRASES = [
  "Click here to teach me something.",
  "I am ready to learn.",
  "What are you going to teach me next?",
  "Teach me a doodle and I'll do my best to remember it.",
  "I'm ready for a new doodle lesson.",
  "Pick something to teach me.",
];

const HOME_PROGRESS_CAN_ADD_PHRASES = [
  "So far, you've taught me about {topics}. Teach me something else.",
  "I know {topics} so far. Want to teach me another kind of doodle?",
];

const HOME_PROGRESS_FULL_PHRASES = [
  "So far, you've taught me about {topics}. You can test me or add more drawings now.",
  "I already know {topics}. Try a doodle or keep teaching one of these topics.",
];

const TEST_IDLE_PHRASES = [
  "Draw something and I'll take a guess.",
  "Make a doodle and I'll try to name it.",
];

const GUESS_EMPTY_PHRASES = [
  "Draw something and I'll take a guess.",
  "Make a doodle and I'll try to name it.",
];

const GUESS_DEFINITE_PHRASES = [
  "That really looks like {article} {topic}.",
  "I'm pretty sure that's {article} {topic}.",
];

const GUESS_LIKELY_PHRASES = [
  "I think it's {article} {topic}.",
  "My best guess is {article} {topic}.",
];

const GUESS_MAYBE_PHRASES = [
  "It might be {article} {topic}.",
  "Maybe it's {article} {topic}.",
];

const GUESS_UNSURE_PHRASES = [
  "I'm not sure what that is yet.",
  "I need a clearer doodle before I can guess.",
];

const TRAINING_EXTRACTING_START_PHRASES = [
  "I'm getting your drawings ready...",
  "I'm looking closely at your drawings...",
];

const TRAINING_LEARNING_PHRASES = [
  "I'm learning what {topic} doodles look like.",
  "I'm figuring out how to recognize {topic} doodles.",
];

const TRAINING_SAVING_PHRASES = [
  "I'm saving what I learned on this device...",
  "I'm putting what I learned into my doodle memory...",
];

const TRAINING_DONE_PHRASES = [
  "Done! I learned from your drawings.",
  "All set! I learned from this round of drawings.",
];

const LABEL_PROMPT_TARGET_PHRASES = [
  "Draw a {topic}.",
  "Can you draw a {topic} for me?",
];

const LABEL_PROMPT_OTHER_PHRASES = [
  "Draw something that is not a {topic}.",
  "Draw a doodle that is not a {topic}.",
];

const LABEL_PROMPT_MORE_TARGET_PHRASES = [
  "Draw another {topic}.",
  "Teach me with another {topic} doodle.",
];

const LABEL_PROMPT_MORE_OTHER_PHRASES = [
  "Draw another doodle that is not a {topic}.",
  "Show me one more doodle that is not a {topic}.",
];

const LABEL_DONE_NEW_PHRASES = [
  "You finished this drawing round.",
  "Nice work. You have enough drawings for this round.",
];

const LABEL_DONE_ADD_MORE_PHRASES = [
  "You can teach my AI now, or keep adding more drawings.",
  "You have enough drawings already, but you can still add more if you want.",
];

const LABEL_READY_NEW_PHRASES = [
  "You have enough drawings to teach my AI.",
  "Your AI is ready to learn from these drawings.",
];

const LABEL_SAVE_EMPTY_PHRASES = [
  "Draw something first, then save it.",
  "Make a doodle first, then tap save.",
];

const LABEL_NEED_MORE_PHRASES = [
  "You still need {needs}.",
  "Keep going — you need {needs}.",
  "Almost there! You need {needs}.",
];

export function pickHomeEmptyPhrase(): string {
  return pickRandom(HOME_EMPTY_PHRASES);
}

export function pickHomeEmptyPhrases(count: number): string[] {
  const pool = [...HOME_EMPTY_PHRASES];

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }

  if (count <= pool.length) {
    return pool.slice(0, count);
  }

  return Array.from({ length: count }, (_, index) => pool[index % pool.length]);
}

export function pickHomeProgressPhrase(
  topicNames: string[],
  canAddTopic: boolean,
): string {
  const topics = formatList(topicNames.map((name) => name.toLowerCase()));
  return fillTemplate(
    pickRandom(canAddTopic ? HOME_PROGRESS_CAN_ADD_PHRASES : HOME_PROGRESS_FULL_PHRASES),
    { topics },
  );
}

export function pickTestIdlePhrase(): string {
  return pickRandom(TEST_IDLE_PHRASES);
}

function articleFor(topicName: string): string {
  const first = topicName.trim().charAt(0).toLowerCase();
  return "aeiou".includes(first) ? "an" : "a";
}

function fillGuessTopic(template: string, topicName: string): string {
  return fillTemplate(template, {
    topic: topicName.toLowerCase(),
    article: articleFor(topicName),
  });
}

export function pickGuessEmptyPhrase(): string {
  return pickRandom(GUESS_EMPTY_PHRASES);
}

export function pickGuessHeadline(
  tone: "definite" | "likely" | "maybe" | "unsure",
  topicName: string,
): string {
  if (tone === "definite") {
    return fillGuessTopic(pickRandom(GUESS_DEFINITE_PHRASES), topicName);
  }
  if (tone === "likely") {
    return fillGuessTopic(pickRandom(GUESS_LIKELY_PHRASES), topicName);
  }
  if (tone === "maybe") {
    return fillGuessTopic(pickRandom(GUESS_MAYBE_PHRASES), topicName);
  }
  return pickRandom(GUESS_UNSURE_PHRASES);
}

export function pickTrainingExtractingStartPhrase(): string {
  return pickRandom(TRAINING_EXTRACTING_START_PHRASES);
}

export function pickTrainingLearningPhrase(topicName: string): string {
  return fillTemplate(pickRandom(TRAINING_LEARNING_PHRASES), {
    topic: topicName.toLowerCase(),
  });
}

export function pickTrainingSavingPhrase(): string {
  return pickRandom(TRAINING_SAVING_PHRASES);
}

export function pickTrainingDonePhrase(): string {
  return pickRandom(TRAINING_DONE_PHRASES);
}

export function pickLabelPromptTargetPhrase(topicName: string): string {
  return fillTemplate(pickRandom(LABEL_PROMPT_TARGET_PHRASES), {
    topic: topicName.toLowerCase(),
  });
}

export function pickLabelPromptOtherPhrase(topicName: string): string {
  return fillTemplate(pickRandom(LABEL_PROMPT_OTHER_PHRASES), {
    topic: topicName.toLowerCase(),
  });
}

export function pickLabelPromptMoreTargetPhrase(topicName: string): string {
  return fillTemplate(pickRandom(LABEL_PROMPT_MORE_TARGET_PHRASES), {
    topic: topicName.toLowerCase(),
  });
}

export function pickLabelPromptMoreOtherPhrase(topicName: string): string {
  return fillTemplate(pickRandom(LABEL_PROMPT_MORE_OTHER_PHRASES), {
    topic: topicName.toLowerCase(),
  });
}

export function pickLabelDonePhrase(keepAdding: boolean): string {
  return pickRandom(keepAdding ? LABEL_DONE_ADD_MORE_PHRASES : LABEL_DONE_NEW_PHRASES);
}

export function pickLabelReadyPhrase(keepAdding: boolean): string {
  if (keepAdding) {
    return pickLabelDonePhrase(true);
  }
  return pickRandom(LABEL_READY_NEW_PHRASES);
}

export function pickLabelNeedMorePhrase(needs: string[]): string {
  return fillTemplate(pickRandom(LABEL_NEED_MORE_PHRASES), {
    needs: needs.join(", "),
  });
}

export function pickLabelSaveEmptyPhrase(): string {
  return pickRandom(LABEL_SAVE_EMPTY_PHRASES);
}
