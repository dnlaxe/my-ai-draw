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
    <section className="home-screen">
      <h2 className="home-title">My AI</h2>

      {progressPhrase ? (
        <p className="home-progress">{progressPhrase}</p>
      ) : null}

      <div
        className={`home-list-region screen-scroll-region ${hasModels ? "home-list-region--with-action" : ""}`}
      >
        <TrainingRecordList
          records={records}
          canAddTopic={canAddTopic}
          onAdd={onAdd}
          onRemove={onRemove}
          onAddMore={onAddMore}
        />
      </div>

      {hasModels ? (
        <div className="home-docked-action screen-docked-footer">
          <button
            type="button"
            onClick={onTest}
            className="home-test-button btn btn-primary"
          >
            See what I know
          </button>
        </div>
      ) : null}
    </section>
  );
}
