import { useMemo } from "react";
import { LABEL_DISPLAY, MAX_TOPICS } from "../drawBank";
import { pickHomeEmptyPhrases } from "../copy/phrases";
import {
  formatRecordTitle,
  type TrainingRecord,
} from "../storage/trainingLibraryStore";

type TrainingRecordListProps = {
  records: TrainingRecord[];
  canAddTopic: boolean;
  onAdd: () => void;
  onRemove: (recordId: string) => void;
  onAddMore: (recordId: string) => void;
};

function accuracyPercent(accuracy: number): number {
  return Math.round(accuracy * 100);
}

export function TrainingRecordList({
  records,
  canAddTopic,
  onAdd,
  onRemove,
  onAddMore,
}: TrainingRecordListProps) {
  const placeholderCount = Math.max(0, MAX_TOPICS - records.length);
  const emptyPhrases = useMemo(
    () => pickHomeEmptyPhrases(placeholderCount),
    [placeholderCount],
  );

  return (
    <ul className="home-record-list">
      {records.map((record) => (
        <li key={record.id} className="home-record-card card">
          <button
            type="button"
            onClick={() => onRemove(record.id)}
            aria-label={`Remove ${formatRecordTitle(record)}`}
            className="home-record-remove btn btn-icon"
          >
            ×
          </button>

          <p className="home-record-title">{LABEL_DISPLAY[record.targetLabel]}</p>

          <div className="home-record-stats">
            <p>How well I learned: {accuracyPercent(record.accuracy)}%</p>
            <p>{record.exampleCount} saved drawings</p>
          </div>

          <button
            type="button"
            onClick={() => onAddMore(record.id)}
            className="home-record-action btn btn-secondary"
          >
            Add more drawings
          </button>
        </li>
      ))}

      {Array.from({ length: placeholderCount }).map((_, index) => (
        <li
          key={`placeholder-${index}`}
          className="home-record-card home-record-card--empty card card-muted"
        >
          <p className="home-record-placeholder-copy">{emptyPhrases[index]}</p>
          <button
            type="button"
            onClick={onAdd}
            disabled={!canAddTopic}
            className="home-record-create btn btn-primary"
          >
            + Teach a topic
          </button>
        </li>
      ))}
    </ul>
  );
}
