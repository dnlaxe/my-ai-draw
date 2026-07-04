import { useEffect, useRef, useState } from "react";
import type { DrawTopic } from "../drawBank";
import { LABEL_DISPLAY } from "../drawBank";
import {
  pickLabelDonePhrase,
  pickLabelSaveEmptyPhrase,
  pickLabelTitlePhrase,
} from "../copy/phrases";
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

type LabelScreenProps = {
  target: DrawTopic;
  labelMode: "new" | "addMore";
  labeled: Record<string, UserLabel>;
  onAddDrawing: (id: string, label: UserLabel, strokes: Stroke[]) => void;
  onNavigate: Navigate;
};

export function LabelScreen({
  target,
  labelMode,
  labeled,
  onAddDrawing,
  onNavigate,
}: LabelScreenProps) {
  const targetName = LABEL_DISPLAY[target];
  const [saveError, setSaveError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureRef = useRef(createStrokeCapture());

  const counts = countLabels(labeled, target);
  const prompt = getNextPrompt(labeled, target, targetName, {
    keepAdding: labelMode === "addMore",
  });
  const ready = canStartTraining(labeled, target);
  const promptText = prompt
    ? prompt.instruction
    : pickLabelDonePhrase(labelMode === "addMore");
  const statusText = getTrainingStatusMessage(labeled, target, targetName, {
    keepAdding: labelMode === "addMore",
  });

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
      setSaveError(pickLabelSaveEmptyPhrase());
      return;
    }

    onAddDrawing(crypto.randomUUID(), prompt.label, canvasStrokes);
    captureRef.current.clear();
  }

  return (
    <section className="screen">
      <h2>{pickLabelTitlePhrase(targetName)}</h2>
      <div>
        <p>{promptText}</p>
        <p>
          Saved drawings: {counts.total}/{MIN_TOTAL}
        </p>
        <p>
          {targetName}: {counts.positive} (need {MIN_YES}) · Other:{" "}
          {counts.negative} (need {MIN_NO})
        </p>
        <p>{statusText}</p>
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
        Save drawing
      </button>
      <button
        type="button"
        onClick={() => onNavigate("train")}
        disabled={!ready}
      >
        Teach my AI
      </button>
      <button
        type="button"
        onClick={() => onNavigate(labelMode === "addMore" ? "home" : "pick")}
      >
        {labelMode === "addMore" ? "Back home" : "Back to topics"}
      </button>
    </section>
  );
}
