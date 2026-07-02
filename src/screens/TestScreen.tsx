import type { Navigate } from "./types";

export function TestScreen({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <section className="screen">
      <h2>Test</h2>
      <p>Live guessing time.</p>
      <button type="button" onClick={() => onNavigate("home")}>
        Back home
      </button>
    </section>
  );
}
