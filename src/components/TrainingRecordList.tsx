import { useMemo } from "react";
import { LABEL_DISPLAY } from "../drawBank";
import { pickHomeEmptyPhrase } from "../copy/phrases";
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
  const emptyPhrase = useMemo(() => pickHomeEmptyPhrase(), []);

  if (records.length === 0) {
    return <p>{emptyPhrase}</p>;
  }

  return (
    <ul>
      {records.map((record) => (
        <li key={record.id}>
          <button
            type="button"
            onClick={() => onRemove(record.id)}
            aria-label={`Remove ${formatRecordTitle(record)}`}
          >
            ×
          </button>

          <p>{LABEL_DISPLAY[record.targetLabel]}</p>

          <div>
            <p>How well I learned: {accuracyPercent(record.accuracy)}%</p>
            <p>{record.exampleCount} saved drawings</p>
          </div>

          <button type="button" onClick={() => onAddMore(record.id)}>
            Add more drawings
          </button>
        </li>
      ))}
    </ul>
  );
}
