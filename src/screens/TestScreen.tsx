import { useCallback, useEffect, useRef, useState } from "react";
import { createStrokeCapture } from "../draw/strokeCapture";
import {
  confidencePercent,
  confidencePercentLabel,
  formatMultiTopicGuess,
  GUESS_DEBOUNCE_MS,
  scoreAllTrainedTopics,
  type MultiTopicGuess,
} from "../draw/prediction";
import {
  loadAllTrainedClassifiers,
  type LoadedTopicClassifier,
} from "../storage/savedModelStore";
import { extractFromStrokes } from "../draw/featureExtractor";
import { LABEL_DISPLAY } from "../drawBank";

export function TestScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureRef = useRef(createStrokeCapture());
  const guessTimerRef = useRef<number | null>(null);
  const modelsRef = useRef<LoadedTopicClassifier[]>([]);
  const isActiveRef = useRef(true);

  const [status, setStatus] = useState("Loading models...");
  const [guess, setGuess] = useState<MultiTopicGuess | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    isActiveRef.current = true;
    let cancelled = false;

    async function start() {
      setStatus("Loading models...");
      try {
        const models = await loadAllTrainedClassifiers();

        if (cancelled) {
          for (const item of models) {
            item.classifier.dispose();
          }
          return;
        }

        if (models.length === 0) {
          setStatus("No trained models yet. Train one first.");
          return;
        }

        modelsRef.current = models;

        setGuess({
          headline: "Draw a doodle!",
          detail: "",
          confidence: 0,
          topic: null,
          tone: "unsure",
          isSure: false,
          rankings: models.map((item) => ({
            topic: item.topic,
            confidence: 0,
            label: LABEL_DISPLAY[item.topic],
          })),
          unknownConfidence: 1,
        });

        setIsReady(true);
        setStatus("");
      } catch (error) {
        if (cancelled) return;
        setStatus(
          error instanceof Error ? error.message : "Failed to load models.",
        );
      }
    }

    void start();

    return () => {
      cancelled = true;
      isActiveRef.current = false;
      for (const item of modelsRef.current) {
        item.classifier.dispose();
      }
      modelsRef.current = [];
    };
  }, []);

  const resetIdleGuess = useCallback(() => {
    const models = modelsRef.current;
    if (models.length === 0) {
      return;
    }

    setGuess({
      headline: "Draw a doodle!",
      detail: "",
      confidence: 0,
      topic: null,
      tone: "unsure",
      isSure: false,
      rankings: models.map((item) => ({
        topic: item.topic,
        confidence: 0,
        label: LABEL_DISPLAY[item.topic],
      })),
      unknownConfidence: 1,
    });
  }, []);

  const runGuess = useCallback(() => {
    if (!isActiveRef.current) {
      return;
    }

    const strokes = captureRef.current.getStrokes();
    const models = modelsRef.current;

    if (strokes.length === 0) {
      resetIdleGuess();
      return;
    }

    const features = extractFromStrokes(strokes);

    const topicScores = models.map((item) => {
      const probabilities = item.classifier.predictProbabilities(features);
      return {
        topic: item.topic,
        confidence: probabilities[item.topic] ?? 0,
      };
    });

    setGuess(formatMultiTopicGuess(scoreAllTrainedTopics(topicScores)));
  }, [resetIdleGuess]);

  function handleClear() {
    captureRef.current.clear();
    resetIdleGuess();
  }

  function handleUndo() {
    captureRef.current.undo();
    runGuess();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isReady) {
      return;
    }

    const capture = captureRef.current;
    capture.attach(canvas);

    capture.onStrokeEnd = () => {
      if (guessTimerRef.current !== null) {
        window.clearTimeout(guessTimerRef.current);
      }
      guessTimerRef.current = window.setTimeout(() => {
        runGuess();
      }, GUESS_DEBOUNCE_MS);
    };

    return () => {
      if (guessTimerRef.current !== null) {
        window.clearTimeout(guessTimerRef.current);
      }
      capture.onStrokeEnd = null;
      capture.detach();
    };
  }, [isReady, runGuess]);

  return (
    <section className="screen test-screen">
      <h2>Test</h2>
      <div className="prediction-panel" aria-live="polite">
        {guess ? (
          <>
            <p className="prediction-headline">{guess.headline}</p>
            {guess.detail ? <p>{guess.detail}</p> : null}

            {guess.rankings.length > 0 ? (
              <ul className="confidence-rankings">
                {guess.rankings.map((item) => (
                  <li key={item.topic}>
                    <span>{item.label}</span>
                    <progress
                      value={confidencePercent(item.confidence)}
                      max={100}
                    />
                    <span>{confidencePercentLabel(item.confidence)}</span>
                  </li>
                ))}
                <li>
                  <span>I don&apos;t know</span>
                  <progress
                    value={confidencePercent(guess.unknownConfidence)}
                    max={100}
                  />
                  <span>{confidencePercentLabel(guess.unknownConfidence)}</span>
                </li>
              </ul>
            ) : null}
          </>
        ) : (
          <p>{status}</p>
        )}
      </div>
      <p>Ready: {isReady ? "yes" : "no"}</p>
      <p>Topics: {guess?.rankings.length ?? 0}</p>
      <canvas
        ref={canvasRef}
        width={320}
        height={320}
        aria-label="Drawing canvas"
      />
      <div className="canvas-toolbar">
        <button type="button" onClick={handleUndo}>
          Undo
        </button>
        <button type="button" onClick={handleClear}>
          Clear
        </button>
      </div>
    </section>
  );
}
