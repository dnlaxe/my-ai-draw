import { useEffect, useRef, useState } from "react";
import type { DrawTopic } from "../drawBank";
import { LABEL_DISPLAY } from "../drawBank";
import {
  pickLabelDonePhrase,
  pickLabelSaveEmptyPhrase,
} from "../copy/phrases";
import { createStrokeCapture, type Stroke } from "../draw/strokeCapture";
import {
  canStartTraining,
  countLabels,
  getNextPrompt,
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
    <section className="label-screen">
      <button
        type="button"
        onClick={() => onNavigate(labelMode === "addMore" ? "home" : "pick")}
        className="label-back-button btn btn-secondary"
      >
        {labelMode === "addMore" ? "Back home" : "Back to topics"}
      </button>

      <div className="label-sidebar">
        <p className="label-prompt">{promptText}</p>

        <div className="label-stats">
          {saveError ? <p className="label-error">{saveError}</p> : null}
          <p>
            {targetName}: {counts.positive} (need {MIN_YES}) · Other:{" "}
            {counts.negative} (need {MIN_NO})
          </p>
          <p>
            Saved drawings: {counts.total}/{MIN_TOTAL}
          </p>
        </div>

        <div className="label-toolbar">
          <div className="label-toolbar-row toolbar">
            <button
              type="button"
              onClick={() => captureRef.current.undo()}
              className="btn btn-secondary"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={() => captureRef.current.clear()}
              className="btn btn-secondary"
            >
              Clear
            </button>
          </div>
          <div className="label-toolbar-row toolbar">
            <button
              type="button"
              onClick={() => onNavigate("train")}
              disabled={!ready}
              className="btn btn-primary"
            >
              Teach my AI
            </button>
            <button
              type="button"
              onClick={handleSaveDrawing}
              disabled={!prompt}
              className="btn btn-primary"
            >
              Save drawing
            </button>
          </div>
        </div>
      </div>

      <div className="label-canvas-region">
        <div className="label-canvas-frame canvas-frame">
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            className="label-canvas canvas-element"
          />
        </div>
      </div>
    </section>
  );
}
