import { useEffect, useRef, useState } from "react";
import type { Stroke } from "../draw/strokeCapture";
import { LABEL_DISPLAY, type DrawTopic } from "../drawBank";
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

export function TrainScreen({
  targetLabel,
  labeledDrawings,
  drawingStrokes,
  recordId,
  onComplete,
  onRetry,
}: TrainScreenProps) {
  const [stage, setStage] = useState<TrainingStage>("extracting");
  const [message, setMessage] = useState(
    "Turning drawings into stroke features...",
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

    function isStale() {
      return cancelled || runId !== runIdRef.current;
    }

    async function runTraining() {
      try {
        const examples: { features: number[]; label: UserLabel }[] = [];

        setStage("extracting");
        setMessage("Turning drawings into stroke features...");
        setProgress(0);

        for (let index = 0; index < entries.length; index += 1) {
          if (isStale()) return;

          const [drawingId, label] = entries[index];
          const strokes = drawingStrokes[drawingId];
          if (!strokes) continue;

          setMessage(
            `Turning drawings into features (${index + 1}/${entries.length})...`,
          );
          setProgress(Math.round(((index + 1) / entries.length) * 50));

          const features = extractFromStrokes(strokes);
          examples.push({ features, label });
        }

        if (isStale()) return;

        if (examples.length === 0) {
          throw new Error("No drawings found. Go back and draw some examples.");
        }

        setStage("training");
        setMessage(`Training: ${LABEL_DISPLAY[targetLabel]} or not...`);
        setProgress(60);

        const trainingMetrics = await classifier.train(examples, classLabels);

        if (isStale()) return;

        setMetrics(trainingMetrics);
        setProgress(85);

        setStage("saving");
        setMessage("Saving your model on this device...");
        await classifier.save(nextRecordId);

        if (isStale()) return;

        setProgress(100);
        setStage("done");
        setMessage(
          `Done! Training score: ${Math.round(trainingMetrics.accuracy * 100)}% on your drawings.`,
        );
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
    <section className="screen">
      <h2>Train model</h2>
      <p>
        This round teaches the model to spot {LABEL_DISPLAY[targetLabel]}{" "}
        doodles vs everything else.
      </p>
      <p>Drawings: {Object.keys(labeledDrawings).length}</p>

      <div aria-live="polite">
        <progress value={progress} max={100} />
        <p className={`status-${stage}`}>{message}</p>
      </div>

      {stage === "done" && metrics ? (
        <button
          type="button"
          onClick={() =>
            onComplete({
              recordId: savedRecordId.current,
              accuracy: metrics.accuracy,
            })
          }
        >
          Test on canvas
        </button>
      ) : null}

      {stage === "error" ? (
        <button type="button" onClick={onRetry}>
          Go back and try again
        </button>
      ) : null}
    </section>
  );
}
