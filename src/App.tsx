import { useState } from "react";
import "./App.css";
import { MAX_TOPICS, type DrawTopic } from "./drawBank";
import type { Stroke } from "./draw/strokeCapture";
import type { UserLabel } from "./labels";
import { DevNav } from "./components/DevNav";
import { HomeScreen } from "./screens/HomeScreen";
import { LabelScreen } from "./screens/LabelScreen";
import { PickScreen } from "./screens/PickScreen";
import { TestScreen } from "./screens/TestScreen";
import { TrainScreen } from "./screens/TrainScreen";
import type { Screen } from "./screens/types";
import {
  getUntrainedTopics,
  loadLibrary,
  type TrainingLibrary,
} from "./storage/trainingLibraryStore";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [targetLabel, setTargetLabel] = useState<DrawTopic | null>(null);
  const [labeledDrawings, setLabeledDrawings] = useState<
    Record<string, UserLabel>
  >({});
  const [drawingStrokes, setDrawingStrokes] = useState<
    Record<string, Stroke[]>
  >({});
  const [library, setLibrary] = useState<TrainingLibrary>(() => loadLibrary());
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  const untrainedTopics = getUntrainedTopics(library.records);
  const canAddTopic =
    library.records.length < MAX_TOPICS && untrainedTopics.length > 0;

  function handleAddTopic() {
    if (!canAddTopic) {
      return;
    }
    setEditingRecordId(null);
    setTargetLabel(null);
    setLabeledDrawings({});
    setDrawingStrokes({});
    setScreen("pick");
  }

  function handlePickTopic(topic: DrawTopic) {
    if (!untrainedTopics.includes(topic)) {
      return;
    }
    setEditingRecordId(null);
    setTargetLabel(topic);
    setLabeledDrawings({});
    setDrawingStrokes({});
    setScreen("label");
  }

  function handleAddDrawing(id: string, label: UserLabel, strokes: Stroke[]) {
    setLabeledDrawings((current) => ({
      ...current,
      [id]: label,
    }));
    setDrawingStrokes((current) => ({
      ...current,
      [id]: strokes,
    }));
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>my-draw-ai</h1>
        <p className="screen-label">Screen: {screen}</p>
      </header>

      {screen === "home" && (
        <HomeScreen
          onNavigate={setScreen}
          onAdd={handleAddTopic}
          canAddTopic={canAddTopic}
          recordCount={library.records.length}
        />
      )}
      {screen === "pick" && (
        <PickScreen
          availableTopics={untrainedTopics}
          onChoose={handlePickTopic}
          onNavigate={setScreen}
        />
      )}
      {screen === "label" && targetLabel && (
        <LabelScreen
          target={targetLabel}
          labeled={labeledDrawings}
          strokes={drawingStrokes}
          onAddDrawing={handleAddDrawing}
          onNavigate={setScreen}
        />
      )}
      {screen === "train" && <TrainScreen onNavigate={setScreen} />}
      {screen === "test" && <TestScreen onNavigate={setScreen} />}

      <DevNav screen={screen} onNavigate={setScreen} />
    </main>
  );
}
