import { LABEL_DISPLAY, MAX_TOPICS, type DrawTopic } from "../drawBank";

type PickScreenProps = {
  availableTopics: DrawTopic[];
  onChoose: (topic: DrawTopic) => void;
};

export function PickScreen({ availableTopics, onChoose }: PickScreenProps) {
  return (
    <section className="screen">
      <h2>What should I learn?</h2>
      <p>You can teach me up to {MAX_TOPICS} kinds of doodles.</p>

      {availableTopics.length > 0 ? (
        <ul>
          {availableTopics.map((topic) => (
            <li key={topic}>
              <button type="button" onClick={() => onChoose(topic)}>
                {LABEL_DISPLAY[topic]}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>You've already taught me every topic for now.</p>
      )}
    </section>
  );
}
