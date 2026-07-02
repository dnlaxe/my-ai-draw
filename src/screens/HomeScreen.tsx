import type { Navigate } from "./types";

type HomeScreenProps = {
  onNavigate: Navigate;
  onAdd: () => void;
};

export function HomeScreen({ onNavigate, onAdd }: HomeScreenProps) {
  return (
    <section className="screen">
      <h2>Home</h2>
      <p>Your models.</p>
      <button type="button" onClick={onAdd}>
        + Add a topic
      </button>
      <button type="button" onClick={() => onNavigate("test")}>
        Test doodles
      </button>
    </section>
  );
}
