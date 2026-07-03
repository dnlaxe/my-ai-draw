import { TrainingRecordList } from "../components/TrainingRecordList";
import type { TrainingRecord } from "../storage/trainingLibraryStore";

type HomeScreenProps = {
  records: TrainingRecord[];
  canAddTopic: boolean;
  onAdd: () => void;
  onTest: () => void;
  onRemove: (recordId: string) => void;
  onAddMore: (recordId: string) => void;
};

export function HomeScreen({
  records,
  canAddTopic,
  onAdd,
  onTest,
  onRemove,
  onAddMore,
}: HomeScreenProps) {
  const hasModels = records.length > 0;

  return (
    <section className="screen">
      <h2>Home</h2>

      <button type="button" onClick={onAdd} disabled={!canAddTopic}>
        + Add a topic
      </button>

      <TrainingRecordList
        records={records}
        onRemove={onRemove}
        onAddMore={onAddMore}
      />

      {hasModels ? (
        <button type="button" onClick={onTest}>
          Test doodles
        </button>
      ) : null}
    </section>
  );
}
