import type { Navigate } from "./types";

export function TrainScreen({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <section className="screen">
      <h2>Train</h2>
      <p>TensorFlow</p>
      <button type="button" onClick={() => onNavigate("test")}>
        Pretend training finished
      </button>
      <button type="button" onClick={() => onNavigate("label")}>
        Back
      </button>
    </section>
  );
}
