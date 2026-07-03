import { ALL_TOPICS, LABEL_DISPLAY, type DrawTopic } from "../drawBank";
import type { UserLabel } from "../labels";
import type { Stroke } from "../draw/strokeCapture";

export type TrainingRecord = {
  id: string;
  targetLabel: DrawTopic;
  labeledDrawings: Record<string, UserLabel>;
  drawingStrokes: Record<string, Stroke[]>;
  accuracy: number;
  exampleCount: number;
  createdAt: string;
  updatedAt: string;
};

export type TrainingLibrary = {
  activeRecordId: string | null;
  records: TrainingRecord[];
};

const STORAGE_KEY = "my-ai-draw-library";

function emptyLibrary(): TrainingLibrary {
  return { activeRecordId: null, records: [] };
}

export function loadLibrary(): TrainingLibrary {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return emptyLibrary();
  }

  try {
    return JSON.parse(raw) as TrainingLibrary;
  } catch {
    return emptyLibrary();
  }
}

export function saveLibrary(library: TrainingLibrary): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
}

export function upsertRecord(
  record: Omit<TrainingRecord, "createdAt" | "updatedAt"> & {
    createdAt?: string;
  },
): TrainingRecord {
  const library = loadLibrary();
  const now = new Date().toISOString();
  const existing = library.records.find((item) => item.id === record.id);

  const next: TrainingRecord = {
    ...record,
    createdAt: existing?.createdAt ?? record.createdAt ?? now,
    updatedAt: now,
  };

  if (existing) {
    library.records = library.records.map((item) =>
      item.id === record.id ? next : item,
    );
  } else {
    library.records = [next, ...library.records];
  }

  library.activeRecordId = record.id;
  saveLibrary(library);
  return next;
}

export function getTrainedTopics(records: TrainingRecord[]): DrawTopic[] {
  return [...new Set(records.map((record) => record.targetLabel))];
}

export function getUntrainedTopics(records: TrainingRecord[]): DrawTopic[] {
  const trained = new Set(getTrainedTopics(records));
  return ALL_TOPICS.filter((topic) => !trained.has(topic));
}

export function removeRecord(recordId: string): TrainingRecord | null {
  const library = loadLibrary();
  const removed =
    library.records.find((record) => record.id === recordId) ?? null;
  library.records = library.records.filter((record) => record.id !== recordId);

  if (library.activeRecordId === recordId) {
    library.activeRecordId = library.records[0]?.id ?? null;
  }

  saveLibrary(library);
  return removed;
}

export function formatRecordTitle(record: TrainingRecord): string {
  return LABEL_DISPLAY[record.targetLabel];
}
