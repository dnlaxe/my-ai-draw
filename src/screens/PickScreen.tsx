import { LABEL_DISPLAY, MAX_TOPICS, type DrawTopic } from "../drawBank";

type PickScreenProps = {
  availableTopics: DrawTopic[];
  onChoose: (topic: DrawTopic) => void;
};

export function PickScreen({ availableTopics, onChoose }: PickScreenProps) {
  return (
    <section className="pick-screen">
      <h2 className="pick-title">What should I learn?</h2>
      <p className="pick-intro">
        You can teach me up to {MAX_TOPICS} kinds of doodles.
      </p>

      <div className="pick-grid-region screen-scroll-region">
        {availableTopics.length > 0 ? (
          <ul className="pick-grid">
            {availableTopics.map((topic) => (
              <li key={topic} className="pick-card card">
                <button
                  type="button"
                  onClick={() => onChoose(topic)}
                  className="pick-button"
                >
                  {LABEL_DISPLAY[topic]}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="pick-empty-state">
            You&apos;ve already taught me every topic for now.
          </p>
        )}
      </div>
    </section>
  );
}
