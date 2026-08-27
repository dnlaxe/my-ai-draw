import { useEffect, useRef, useState } from "react";
import type { Stroke } from "../draw/strokeCapture";
import { LABEL_DISPLAY, type DrawTopic } from "../drawBank";
import {
  pickTrainingDonePhrase,
  pickTrainingExtractingStartPhrase,
  pickTrainingLearningPhrase,
  pickTrainingSavingPhrase,
} from "../copy/phrases";
import { trainingClassLabels, type UserLabel } from "../labels";
import { extractFromStrokes } from "../draw/featureExtractor";
import { createDrawClassifier, type TrainingMetrics } from "../draw/classifier";

export type TrainingResult = {
  recordId: string;
  accuracy: number;
};

type TrainingStage = "extracting" | "training" | "saving" | "done" | "error";

export type TrainScreenProps = {
  targetLabel: DrawTopic;
  labeledDrawings: Record<string, UserLabel>;
  drawingStrokes: Record<string, Stroke[]>;
  recordId: string | null;
  onComplete: (result: TrainingResult) => void;
  onRetry: () => void;
};

const EXTRACT_STEP_MS = 650;
const LEARN_MIN_MS = 4800;
const SAVE_MIN_MS = 1400;
const TICK_MS = 90;

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function TrainScreen({
  targetLabel,
  labeledDrawings,
  drawingStrokes,
  recordId,
  onComplete,
  onRetry,
}: TrainScreenProps) {
  const [stage, setStage] = useState<TrainingStage>("extracting");
  const [message, setMessage] = useState(() =>
    pickTrainingExtractingStartPhrase(),
  );
  const [progress, setProgress] = useState(0);
  const [metrics, setMetrics] = useState<TrainingMetrics | null>(null);

  const runIdRef = useRef(0);
  const savedRecordId = useRef(recordId ?? crypto.randomUUID());

  useEffect(() => {
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    let cancelled = false;

    const entries = Object.entries(labeledDrawings);

    const classifier = createDrawClassifier();
    const classLabels = trainingClassLabels(targetLabel);
    const nextRecordId = savedRecordId.current;
    const topicName = LABEL_DISPLAY[targetLabel];

    function isStale() {
      return cancelled || runId !== runIdRef.current;
    }

    async function pause(ms: number) {
      const started = performance.now();
      while (performance.now() - started < ms) {
        if (isStale()) return;
        await wait(Math.min(TICK_MS, ms));
      }
    }

    async function crawlProgress(from: number, to: number, durationMs: number) {
      const started = performance.now();
      while (true) {
        if (isStale()) return;
        const elapsed = performance.now() - started;
        // Ease-in so early progress feels heavy / slow to climb.
        const t = Math.min(1, elapsed / durationMs);
        const eased = t * t;
        setProgress(Math.round(from + (to - from) * eased));
        if (t >= 1) break;
        await wait(TICK_MS);
      }
    }

    async function runTraining() {
      try {
        const examples: { features: number[]; label: UserLabel }[] = [];

        setStage("extracting");
        setMessage(pickTrainingExtractingStartPhrase());
        setProgress(0);
        await pause(700);
        if (isStale()) return;

        for (let index = 0; index < entries.length; index += 1) {
          if (isStale()) return;

          const [drawingId, label] = entries[index];
          const strokes = drawingStrokes[drawingId];
          if (!strokes) continue;

          setMessage(
            `I'm studying drawing ${index + 1} of ${entries.length}...`,
          );
          setProgress(Math.round(((index + 1) / entries.length) * 48));

          const features = extractFromStrokes(strokes);
          examples.push({ features, label });
          await pause(EXTRACT_STEP_MS);
        }

        if (isStale()) return;

        if (examples.length === 0) {
          throw new Error("No drawings found. Go back and draw some examples.");
        }

        setStage("training");
        setMessage(pickTrainingLearningPhrase(topicName));
        setProgress(50);

        const learnMessages = [
          pickTrainingLearningPhrase(topicName),
          `Looking hard at every ${topicName.toLowerCase()} line...`,
          `Comparing ${topicName.toLowerCase()} doodles with the others...`,
          `Almost locked in on ${topicName.toLowerCase()} shapes...`,
        ];

        let learnMessageIndex = 0;
        const messageTimer = window.setInterval(() => {
          if (isStale()) return;
          learnMessageIndex = (learnMessageIndex + 1) % learnMessages.length;
          setMessage(learnMessages[learnMessageIndex]);
        }, 1100);

        let trainingMetrics: TrainingMetrics;
        try {
          const trained = classifier.train(examples, classLabels);
          await Promise.all([
            crawlProgress(50, 82, LEARN_MIN_MS),
            trained.then((result) => {
              trainingMetrics = result;
            }),
            pause(LEARN_MIN_MS),
          ]);
        } finally {
          window.clearInterval(messageTimer);
        }

        if (isStale()) return;

        setMetrics(trainingMetrics!);
        setProgress(85);

        setStage("saving");
        setMessage(pickTrainingSavingPhrase());
        await Promise.all([
          classifier.save(nextRecordId),
          crawlProgress(85, 98, SAVE_MIN_MS),
          pause(SAVE_MIN_MS),
        ]);

        if (isStale()) return;

        setProgress(100);
        setStage("done");
        setMessage(pickTrainingDonePhrase());
      } catch (error) {
        if (isStale()) return;
        setStage("error");
        setMessage(error instanceof Error ? error.message : "Training failed.");
        setProgress(0);
      } finally {
        classifier.dispose();
      }
    }
    void runTraining();
    return () => {
      cancelled = true;
    };
  }, [targetLabel, labeledDrawings, drawingStrokes]);

  return (
    <section className="train-screen screen-shell screen-scroll-region">
      <p className="train-copy">
        You drew {Object.keys(labeledDrawings).length} pictures.
      </p>

      <div className="train-progress-region" aria-live="polite">
        <progress className="train-progress" value={progress} max={100} />
        <p className={`train-status train-status--${stage}`}>{message}</p>
      </div>

      <div className="train-actions toolbar">
        <button
          type="button"
          disabled={stage !== "done" || !metrics}
          onClick={() => {
            if (!metrics) return;
            onComplete({
              recordId: savedRecordId.current,
              accuracy: metrics.accuracy,
            });
          }}
          className="btn btn-primary"
        >
          Test me
        </button>
      </div>

      {stage === "error" ? (
        <div className="train-actions toolbar">
          <button type="button" onClick={onRetry} className="btn btn-secondary">
            Go back
          </button>
        </div>
      ) : null}
    </section>
  );
}
