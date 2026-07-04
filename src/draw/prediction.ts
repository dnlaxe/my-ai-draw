import { LABEL_DISPLAY, type DrawTopic } from "../drawBank";
import { pickGuessEmptyPhrase, pickGuessHeadline } from "../copy/phrases";

export const GUESS_DEBOUNCE_MS = 600;

export const DEFINITE_THRESHOLD = 0.85;
export const NOT_SURE_THRESHOLD = 0.7;
export const MAYBE_THRESHOLD = 0.35;
export const EMPTY_CONFIDENCE_THRESHOLD = 0.01;

export type GuessTone = "definite" | "likely" | "maybe" | "unsure";

export type TopicScore = {
  topic: DrawTopic;
  confidence: number; // 0 to 1
  label: string; // "Cat", "House", etc.
};

export type MultiTopicGuess = {
  headline: string; // "I think it's a cat."
  detail: string; // extra line (empty for now)
  confidence: number; // best topic's score
  topic: DrawTopic | null; // winning topic, or null
  tone: GuessTone;
  isSure: boolean; // true for definite/likely
  rankings: TopicScore[]; // all topics sorted
  unknownConfidence: number; // 1 - sum(rankings)
};

export function confidencePercent(confidence: number): number {
  return Math.round(confidence * 1000) / 10;
}

export function confidencePercentLabel(confidence: number): string {
  return `${confidencePercent(confidence).toFixed(1)}%`;
}

function toneForConfidence(confidence: number): GuessTone {
  if (confidence >= DEFINITE_THRESHOLD) return "definite";
  if (confidence >= NOT_SURE_THRESHOLD) return "likely";
  if (confidence >= MAYBE_THRESHOLD) return "maybe";
  return "unsure";
}

function computeUnknownConfidence(rankings: TopicScore[]): number {
  const sum = rankings.reduce((total, item) => total + item.confidence, 0);
  return Math.max(0, 1 - sum);
}

export function scoreAllTrainedTopics(
  topicScores: Array<{ topic: DrawTopic; confidence: number }>,
): TopicScore[] {
  return topicScores.map((item) => ({
    topic: item.topic,
    confidence: item.confidence,
    label: LABEL_DISPLAY[item.topic],
  }));
}

export function formatMultiTopicGuess(
  topicScores: TopicScore[],
): MultiTopicGuess {
  const rankings = [...topicScores].sort(
    (left, right) => right.confidence - left.confidence,
  );
  const unknownConfidence = computeUnknownConfidence(rankings);
  const best = rankings[0];

  // Empty / nearly empty canvas
  if (!best || best.confidence < EMPTY_CONFIDENCE_THRESHOLD) {
    return {
      headline: pickGuessEmptyPhrase(),
      detail: "",
      confidence: 0,
      topic: null,
      tone: "unsure",
      isSure: false,
      rankings,
      unknownConfidence,
    };
  }

  const tone = toneForConfidence(best.confidence);
  const isSure = tone === "definite" || tone === "likely";

  return {
    headline: pickGuessHeadline(tone, best.label),
    detail: "",
    confidence: best.confidence,
    topic: best.topic,
    tone,
    isSure,
    rankings,
    unknownConfidence,
  };
}
