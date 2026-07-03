import { LABEL_DISPLAY } from "../drawBank";
import {
  formatRecordTitle,
  type TrainingRecord,
} from "../storage/trainingLibraryStore";

type TrainingRecordListProps = {
  records: TrainingRecord[];
  onRemove: (recordId: string) => void;
  onAddMore: (recordId: string) => void;
};

function accuracyPercent(accuracy: number): number {
  return Math.round(accuracy * 100);
}

export function TrainingRecordList({
  records,
  onRemove,
  onAddMore,
}: TrainingRecordListProps) {
  if (records.length === 0) {
    return <p>No models yet. Tap + to train one.</p>;
  }

  return (
    <ul className="home-model-grid">
      {records.map((record) => (
        <li key={record.id} className="home-model-card">
          <button
            type="button"
            className="home-model-remove"
            onClick={() => onRemove(record.id)}
            aria-label={`Remove ${formatRecordTitle(record)}`}
          >
            ×
          </button>

          <p className="home-model-name">{LABEL_DISPLAY[record.targetLabel]}</p>
          <p>Training score: {accuracyPercent(record.accuracy)}%</p>
          <p>{record.exampleCount} drawings</p>

          <button type="button" onClick={() => onAddMore(record.id)}>
            Add more
          </button>
        </li>
      ))}
    </ul>
  );
}
