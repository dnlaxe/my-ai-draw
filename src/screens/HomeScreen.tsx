import { useMemo } from "react";
import { LABEL_DISPLAY } from "../drawBank";
import { TrainingRecordList } from "../components/TrainingRecordList";
import { pickHomeProgressPhrase } from "../copy/phrases";
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
  const progressPhrase = useMemo(() => {
    if (!hasModels) {
      return null;
    }

    const topicNames = records.map(
      (record) => LABEL_DISPLAY[record.targetLabel],
    );
    return pickHomeProgressPhrase(topicNames, canAddTopic);
  }, [records, hasModels, canAddTopic]);

  return (
    <section className="screen">
      <h2>My AI</h2>

      {progressPhrase ? <p>{progressPhrase}</p> : null}

      <button type="button" onClick={onAdd} disabled={!canAddTopic}>
        + Teach a topic
      </button>

      <div>
        <TrainingRecordList
          records={records}
          onRemove={onRemove}
          onAddMore={onAddMore}
        />
      </div>

      {hasModels ? (
        <button type="button" onClick={onTest}>
          Try a doodle
        </button>
      ) : null}
    </section>
  );
}
