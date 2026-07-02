import { MAX_TOPICS } from "../drawBank";
import type { Navigate } from "./types";

type HomeScreenProps = {
  onNavigate: Navigate;
  onAdd: () => void;
  canAddTopic: boolean;
  recordCount: number;
};

export function HomeScreen({
  onNavigate,
  onAdd,
  canAddTopic,
  recordCount,
}: HomeScreenProps) {
  return (
    <section className="screen">
      <h2>Home</h2>
      <p>
        Trained models: {recordCount} / {MAX_TOPICS}
      </p>
      <button type="button" onClick={onAdd} disabled={!canAddTopic}>
        + Add a topic
      </button>
      <button type="button" onClick={() => onNavigate("test")}>
        Test doodles
      </button>
    </section>
  );
}
