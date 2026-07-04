import { useState } from "react";
import "./App.css";
import { LABEL_DISPLAY, MAX_TOPICS, type DrawTopic } from "./drawBank";
import { clearSavedModel } from "./draw/classifier";
import type { Stroke } from "./draw/strokeCapture";
import type { UserLabel } from "./labels";
import { HomeScreen } from "./screens/HomeScreen";
import { LabelScreen } from "./screens/LabelScreen";
import { PickScreen } from "./screens/PickScreen";
import { TestScreen } from "./screens/TestScreen";
import { TrainScreen, type TrainingResult } from "./screens/TrainScreen";
import type { Screen } from "./screens/types";
import {
  getUntrainedTopics,
  loadLibrary,
  removeRecord,
  upsertRecord,
  type TrainingLibrary,
  type TrainingRecord,
} from "./storage/trainingLibraryStore";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { HomeButton } from "./components/HomeButton";

type LabelMode = "new" | "addMore";

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
  const [labelMode, setLabelMode] = useState<LabelMode>("new");
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [removeConfirmMessage, setRemoveConfirmMessage] = useState("");

  const untrainedTopics = getUntrainedTopics(library.records);
  const canAddTopic =
    library.records.length < MAX_TOPICS && untrainedTopics.length > 0;
  const isHomeScreen = screen === "home";

  function refreshLibrary() {
    setLibrary(loadLibrary());
  }

  function handleAddTopic() {
    if (!canAddTopic) {
      return;
    }
    setEditingRecordId(null);
    setLabelMode("new");
    setTargetLabel(null);
    setLabeledDrawings({});
    setDrawingStrokes({});
    setScreen("pick");
  }

  function handleGoHome() {
    setScreen("home");
  }

  function handlePickTopic(topic: DrawTopic) {
    if (!untrainedTopics.includes(topic)) {
      return;
    }
    setEditingRecordId(null);
    setLabelMode("new");
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

  function handleTrainingComplete(result: TrainingResult) {
    if (!targetLabel) {
      return;
    }

    upsertRecord({
      id: result.recordId,
      targetLabel,
      labeledDrawings,
      drawingStrokes,
      accuracy: result.accuracy,
      exampleCount: Object.keys(labeledDrawings).length,
    });

    setEditingRecordId(null);
    setLabelMode("new");
    refreshLibrary();
    setScreen("test");
  }

  function beginEditing(record: TrainingRecord) {
    setEditingRecordId(record.id);
    setLabelMode("addMore");
    setTargetLabel(record.targetLabel);
    setLabeledDrawings({ ...record.labeledDrawings });
    setDrawingStrokes({ ...record.drawingStrokes });
    setScreen("label");
  }

  function handleAddMore(recordId: string) {
    const record = library.records.find((item) => item.id === recordId);
    if (!record) {
      return;
    }
    beginEditing(record);
  }

  function handleRemoveRequest(recordId: string) {
    const record = library.records.find((item) => item.id === recordId);
    if (!record) {
      return;
    }
    setRemoveConfirmMessage(
      `Remove ${LABEL_DISPLAY[record.targetLabel]} from my AI? You can teach it again later.`,
    );
    setPendingRemoveId(recordId);
  }

  async function handleRemoveConfirm() {
    if (!pendingRemoveId) {
      return;
    }

    const recordId = pendingRemoveId;
    setPendingRemoveId(null);
    setRemoveConfirmMessage("");

    await clearSavedModel(recordId);
    removeRecord(recordId);
    refreshLibrary();

    if (editingRecordId === recordId) {
      setEditingRecordId(null);
      setTargetLabel(null);
      setLabeledDrawings({});
      setDrawingStrokes({});
    }
  }

  return (
    <>
      {pendingRemoveId ? (
        <ConfirmDialog
          message={removeConfirmMessage}
          cancelLabel="Keep it"
          confirmLabel="Remove"
          onCancel={() => {
            setPendingRemoveId(null);
            setRemoveConfirmMessage("");
          }}
          onConfirm={() => void handleRemoveConfirm()}
        />
      ) : null}

      <main className="app-root">
        {!isHomeScreen ? <HomeButton onClick={handleGoHome} /> : null}

        {!isHomeScreen ? (
          <div className="app-page">
            <header className="app-header">
              <h1 className="app-title">my-ai-draw</h1>
            </header>

            {screen === "pick" && (
              <PickScreen
                availableTopics={untrainedTopics}
                onChoose={handlePickTopic}
              />
            )}
            {screen === "label" && targetLabel && (
              <LabelScreen
                target={targetLabel}
                labelMode={labelMode}
                labeled={labeledDrawings}
                onAddDrawing={handleAddDrawing}
                onNavigate={setScreen}
              />
            )}
            {screen === "train" && targetLabel && (
              <TrainScreen
                targetLabel={targetLabel}
                labeledDrawings={labeledDrawings}
                drawingStrokes={drawingStrokes}
                recordId={editingRecordId}
                onComplete={handleTrainingComplete}
                onRetry={() => setScreen("label")}
              />
            )}
            {screen === "test" && <TestScreen />}
          </div>
        ) : null}

        {isHomeScreen && (
          <HomeScreen
            records={library.records}
            canAddTopic={canAddTopic}
            onAdd={handleAddTopic}
            onTest={() => setScreen("test")}
            onRemove={handleRemoveRequest}
            onAddMore={handleAddMore}
          />
        )}
      </main>
    </>
  );
}
