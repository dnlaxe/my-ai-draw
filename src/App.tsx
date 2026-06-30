import { useEffect, useRef, useState } from "react";
import {
  ALL_TOPICS,
  LABEL_DISPLAY,
  MAX_TOPICS,
  type DrawTopic,
} from "./drawBank";
import { createStrokeCapture } from "./draw/strokeCapture";
import {
  canStartTraining,
  countLabels,
  getNextPrompt,
  MIN_TOTAL,
  type UserLabel,
} from "./labels";

type Screen = "home" | "pick" | "label" | "train" | "test";

type Navigate = (screen: Screen) => void;

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>my-draw-ai</h1>
        <p className="screen-label">Screen: {screen}</p>
      </header>

      {screen === "home" && <HomeScreen onNavigate={setScreen} />}
      {screen === "pick" && <PickScreen onNavigate={setScreen} />}
      {screen === "label" && <LabelScreen onNavigate={setScreen} />}
      {screen === "train" && <TrainScreen onNavigate={setScreen} />}
      {screen === "test" && <TestScreen onNavigate={setScreen} />}

      <nav className="dev-nav">
        <p>Jump to:</p>
        <div className="dev-nav-buttons">
          <NavButton current={screen} target="home" onNavigate={setScreen} />
          <NavButton current={screen} target="pick" onNavigate={setScreen} />
          <NavButton current={screen} target="label" onNavigate={setScreen} />
          <NavButton current={screen} target="train" onNavigate={setScreen} />
          <NavButton current={screen} target="test" onNavigate={setScreen} />
        </div>
      </nav>
    </main>
  );
}

function HomeScreen({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <section className="screen">
      <h2>Home</h2>
      <p>Your models.</p>
      <button type="button" onClick={() => onNavigate("pick")}>
        + Add a topic
      </button>
      <button type="button" onClick={() => onNavigate("test")}>
        Test doodles
      </button>
    </section>
  );
}

function PickScreen({ onNavigate }: { onNavigate: Navigate }) {
  function handlePick(topic: DrawTopic) {
    console.log("picked:", topic);
    onNavigate("label");
  }

  return (
    <section className="screen">
      <h2>Pick a topic</h2>
      <p>Train up to {MAX_TOPICS} topics.</p>

      <ul>
        {ALL_TOPICS.map((topic) => (
          <li key={topic}>
            <button type="button" onClick={() => handlePick(topic)}>
              {LABEL_DISPLAY[topic]}
            </button>
          </li>
        ))}
      </ul>

      <button type="button" onClick={() => onNavigate("home")}>
        Back
      </button>
    </section>
  );
}

function LabelScreen({ onNavigate }: { onNavigate: Navigate }) {
  const target: DrawTopic = "cat";
  const targetName = LABEL_DISPLAY[target];

  const [labeled, setLabeled] = useState<Record<string, UserLabel>>({});

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

  function fakeSave(label: UserLabel) {
    setLabeled((current) => ({
      ...current,
      [crypto.randomUUID()]: label,
    }));
    captureRef.current.clear();
  }

  function logStrokes() {
    console.log(captureRef.current.getStrokes());
  }

  return (
    <section className="screen">
      <h2>Label drawings</h2>
      <p>{prompt ? prompt.instruction : "Enough drawings. Ready to train."}</p>
      <p>
        Saved: {counts.total}/{MIN_TOTAL} ({targetName}: {counts.positive},
        other: {counts.negative})
      </p>
      <p>Can train: {ready ? "yes" : "no"}</p>

      <canvas ref={canvasRef} width={320} height={320} />

      <button type="button" onClick={() => captureRef.current.undo()}>
        Undo
      </button>
      <button type="button" onClick={() => captureRef.current.clear()}>
        Clear
      </button>
      <button type="button" onClick={logStrokes}>
        Log strokes
      </button>
      <button type="button" onClick={() => fakeSave(target)}>
        Dev: fake save YES
      </button>
      <button type="button" onClick={() => fakeSave("other")}>
        Dev: fake save NO
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

function TrainScreen({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <section className="screen">
      <h2>Train</h2>
      <p>TensorFlow</p>
      <button type="button" onClick={() => onNavigate("test")}>
        Pretend training finished
      </button>
      <button type="button" onClick={() => onNavigate("label")}>
        Back
      </button>
    </section>
  );
}

function TestScreen({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <section className="screen">
      <h2>Test</h2>
      <p>Live guessing time.</p>
      <button type="button" onClick={() => onNavigate("home")}>
        Back home
      </button>
    </section>
  );
}

function NavButton({
  current,
  target,
  onNavigate,
}: {
  current: Screen;
  target: Screen;
  onNavigate: Navigate;
}) {
  return (
    <button
      type="button"
      className={current === target ? "dev-nav-active" : undefined}
      onClick={() => onNavigate(target)}
    >
      {target}
    </button>
  );
}
