import { useCallback, useEffect, useRef, useState } from "react";
import { pickTestIdlePhrase } from "../copy/phrases";
import { createStrokeCapture } from "../draw/strokeCapture";
import {
  confidencePercent,
  confidencePercentLabel,
  formatMultiTopicGuess,
  GUESS_DEBOUNCE_MS,
  isLowSignalDrawing,
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

  const [status, setStatus] = useState("Getting my doodle brain ready...");
  const [guess, setGuess] = useState<MultiTopicGuess | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [idleHeadline] = useState(() => pickTestIdlePhrase());

  const buildIdleGuess = useCallback(
    (headline: string, detail = ""): MultiTopicGuess => ({
      headline,
      detail,
      confidence: 0,
      topic: null,
      tone: "unsure",
      isSure: false,
      rankings: modelsRef.current.map((item) => ({
        topic: item.topic,
        confidence: 0,
        label: LABEL_DISPLAY[item.topic],
      })),
      unknownConfidence: 1,
    }),
    [],
  );

  useEffect(() => {
    isActiveRef.current = true;
    let cancelled = false;

    async function start() {
      setStatus("Getting my doodle brain ready...");
      try {
        const models = await loadAllTrainedClassifiers();

        if (cancelled) {
          for (const item of models) {
            item.classifier.dispose();
          }
          return;
        }

        if (models.length === 0) {
          setStatus("I don't know any doodles yet. Teach me one first.");
          return;
        }

        modelsRef.current = models;

        setGuess(buildIdleGuess(idleHeadline));

        setIsReady(true);
        setStatus("");
      } catch (error) {
        if (cancelled) return;
        setStatus(
          error instanceof Error
            ? error.message
            : "I couldn't load what I learned. Try again.",
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
  }, [buildIdleGuess, idleHeadline]);

  const resetIdleGuess = useCallback(() => {
    const models = modelsRef.current;
    if (models.length === 0) {
      return;
    }

    setGuess(buildIdleGuess(idleHeadline));
  }, [buildIdleGuess, idleHeadline]);

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

    if (isLowSignalDrawing(strokes)) {
      setGuess(
        buildIdleGuess(
          "Draw a little more and I'll try again.",
          "That doodle is too small or quick for me to guess yet.",
        ),
      );
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
  }, [buildIdleGuess, resetIdleGuess]);

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
    <section className="label-screen test-screen">
      <div className="label-sidebar test-panel">
        <div className="label-copy test-prediction" aria-live="polite">
          {guess ? (
            <>
              <p className="test-headline">{guess.headline}</p>
              {guess.detail ? (
                <p className="test-detail">{guess.detail}</p>
              ) : null}

              {guess.rankings.length > 0 ? (
                <ul className="test-rankings">
                  {guess.rankings.map((item) => (
                    <li key={item.topic} className="test-ranking-item">
                      <span className="test-ranking-label">{item.label}</span>
                      <progress
                        className="test-ranking-bar"
                        value={confidencePercent(item.confidence)}
                        max={100}
                      />
                      <span className="test-ranking-value">
                        {confidencePercentLabel(item.confidence)}
                      </span>
                    </li>
                  ))}
                  <li className="test-ranking-item">
                    <span className="test-ranking-label">
                      I don&apos;t know
                    </span>
                    <progress
                      className="test-ranking-bar"
                      value={confidencePercent(guess.unknownConfidence)}
                      max={100}
                    />
                    <span className="test-ranking-value">
                      {confidencePercentLabel(guess.unknownConfidence)}
                    </span>
                  </li>
                </ul>
              ) : null}
            </>
          ) : (
            <p className="test-detail">{status}</p>
          )}
        </div>

        <div className="label-toolbar test-toolbar">
          <div className="label-toolbar-row toolbar">
            <button
              type="button"
              onClick={handleUndo}
              className="btn btn-secondary"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="btn btn-secondary"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="label-canvas-region test-canvas-dock">
        <div className="label-canvas-frame test-canvas-frame canvas-frame">
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            aria-label="Drawing canvas"
            className="label-canvas test-canvas canvas-element"
          />
        </div>
      </div>
    </section>
  );
}
