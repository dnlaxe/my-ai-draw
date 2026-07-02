import { useEffect, useRef, useState } from "react";
import type { DrawTopic } from "../drawBank";
import { LABEL_DISPLAY } from "../drawBank";
import { createStrokeCapture, type Stroke } from "../draw/strokeCapture";
import {
  canStartTraining,
  countLabels,
  getNextPrompt,
  getTrainingStatusMessage,
  MIN_NO,
  MIN_TOTAL,
  MIN_YES,
  type UserLabel,
} from "../labels";
import type { Navigate } from "./types";
import { extractFromStrokes } from "../draw/featureExtractor";

type LabelScreenProps = {
  target: DrawTopic;
  labeled: Record<string, UserLabel>;
  strokes: Record<string, Stroke[]>;
  onAddDrawing: (id: string, label: UserLabel, strokes: Stroke[]) => void;
  onNavigate: Navigate;
};

export function LabelScreen({
  target,
  labeled,
  strokes,
  onAddDrawing,
  onNavigate,
}: LabelScreenProps) {
  const targetName = LABEL_DISPLAY[target];
  const [saveError, setSaveError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureRef = useRef(createStrokeCapture());

  const counts = countLabels(labeled, target);
  const prompt = getNextPrompt(labeled, target, targetName);
  const ready = canStartTraining(labeled, target);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const capture = captureRef.current;
    capture.attach(canvas);
    return () => {
      capture.detach();
    };
  }, []);

  function handleSaveDrawing() {
    setSaveError(null);

    if (!prompt) {
      return;
    }

    const canvasStrokes = captureRef.current.getStrokes();
    if (canvasStrokes.length === 0) {
      setSaveError("Draw something first.");
      return;
    }

    const features = extractFromStrokes(canvasStrokes);
    console.log("feature length:", features.length);
    console.log("extras:", features.slice(1024)); //
    console.log(
      "ink pixels:",
      features.slice(0, 1024).filter((v) => v > 0).length,
    );

    onAddDrawing(crypto.randomUUID(), prompt.label, canvasStrokes);
    captureRef.current.clear();
  }

  return (
    <section className="screen">
      <h2>Label drawings — {targetName}</h2>
      <div>
        <p>{prompt ? prompt.instruction : "All prompts done."}</p>
        <p>
          Drawings saved: {counts.total}/{MIN_TOTAL}
        </p>
        <p>
          {targetName}: {counts.positive} (min {MIN_YES}) · Other:{" "}
          {counts.negative} (min {MIN_NO})
        </p>
        <p>{getTrainingStatusMessage(labeled, target, targetName)}</p>
      </div>
      {saveError ? <p>{saveError}</p> : null}

      <canvas ref={canvasRef} width={320} height={320} />

      <button type="button" onClick={() => captureRef.current.undo()}>
        Undo
      </button>
      <button type="button" onClick={() => captureRef.current.clear()}>
        Clear
      </button>
      <button type="button" onClick={handleSaveDrawing} disabled={!prompt}>
        Save this drawing
      </button>
      <button type="button" onClick={() => console.log({ labeled, strokes })}>
        Log dataset
      </button>
      <button
        type="button"
        onClick={() => onNavigate("train")}
        disabled={!ready}
      >
        Train my model
      </button>
      <button type="button" onClick={() => onNavigate("pick")}>
        Back
      </button>
    </section>
  );
}
