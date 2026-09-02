import { LABEL_DISPLAY, type DrawTopic } from "../drawBank";
import { pickGuessEmptyPhrase, pickGuessHeadline } from "../copy/phrases";
import type { Stroke } from "./strokeCapture";

export const GUESS_DEBOUNCE_MS = 600;

export const ACCEPT_THRESHOLD = 0.58;
export const MARGIN_THRESHOLD = 0.06;
export const DEFINITE_THRESHOLD = 0.85;
export const NOT_SURE_THRESHOLD = 0.58;
export const MAYBE_THRESHOLD = 0.35;
export const EMPTY_CONFIDENCE_THRESHOLD = 0.01;
const MIN_SIGNAL_POINTS = 8;
const MIN_SIGNAL_PATH_LENGTH = 32;
const MIN_SIGNAL_BOUNDS_DIAGONAL = 24;

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
  unknownConfidence: number; // rule-based score for "I don't know"
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
  const best = rankings[0]?.confidence ?? 0;
  const second = rankings[1]?.confidence ?? 0;
  const scoreGap = Math.max(0, best - second);
  const acceptShortfall = Math.max(0, ACCEPT_THRESHOLD - best) / ACCEPT_THRESHOLD;
  const marginShortfall = Math.max(0, MARGIN_THRESHOLD - scoreGap) / MARGIN_THRESHOLD;
  return Math.min(1, Math.max(1 - best, acceptShortfall, marginShortfall));
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
  const best = rankings[0];
  const second = rankings[1];

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
      unknownConfidence: 1,
    };
  }

  const scoreGap = best.confidence - (second?.confidence ?? 0);
  if (
    best.confidence < ACCEPT_THRESHOLD ||
    (second && scoreGap < MARGIN_THRESHOLD)
  ) {
    return {
      headline: "I don't know that doodle yet.",
      detail:
        second && scoreGap < MARGIN_THRESHOLD
          ? `It looks a bit like both ${best.label.toLowerCase()} and ${second.label.toLowerCase()}.`
          : "Try a bigger or clearer doodle.",
      confidence: best.confidence,
      topic: null,
      tone: "unsure",
      isSure: false,
      rankings,
      unknownConfidence: computeUnknownConfidence(rankings),
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
    unknownConfidence: computeUnknownConfidence(rankings),
  };
}

export function isLowSignalDrawing(strokes: Stroke[]): boolean {
  if (strokes.length === 0) {
    return true;
  }

  let totalPoints = 0;
  let totalPathLength = 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const stroke of strokes) {
    totalPoints += stroke.points.length;

    for (let index = 0; index < stroke.points.length; index += 1) {
      const point = stroke.points[index];
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);

      if (index === 0) {
        continue;
      }

      const previous = stroke.points[index - 1];
      totalPathLength += Math.hypot(point.x - previous.x, point.y - previous.y);
    }
  }

  if (
    totalPoints < MIN_SIGNAL_POINTS ||
    totalPathLength < MIN_SIGNAL_PATH_LENGTH
  ) {
    return true;
  }

  const boundsDiagonal = Number.isFinite(minX)
    ? Math.hypot(maxX - minX, maxY - minY)
    : 0;

  return boundsDiagonal < MIN_SIGNAL_BOUNDS_DIAGONAL;
}
