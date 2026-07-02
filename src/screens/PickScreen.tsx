import {
  ALL_TOPICS,
  LABEL_DISPLAY,
  MAX_TOPICS,
  type DrawTopic,
} from "../drawBank";
import type { Navigate } from "./types";

type PickScreenProps = {
  onChoose: (topic: DrawTopic) => void;
  onNavigate: Navigate;
};

export function PickScreen({ onChoose, onNavigate }: PickScreenProps) {
  return (
    <section className="screen">
      <h2>Pick a topic</h2>
      <p>Train up to {MAX_TOPICS} topics.</p>

      <ul>
        {ALL_TOPICS.map((topic) => (
          <li key={topic}>
            <button type="button" onClick={() => onChoose(topic)}>
              {LABEL_DISPLAY[topic]}
            </button>
          </li>
        ))}
      </ul>

      <button type="button" onClick={() => onNavigate("home")}>
        Back
      </button>
    </section>
  );
}
