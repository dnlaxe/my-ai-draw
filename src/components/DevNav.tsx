import type { Navigate, Screen } from "../screens/types";

type DevNavProps = {
  screen: Screen;
  onNavigate: Navigate;
};

export function DevNav({ screen, onNavigate }: DevNavProps) {
  const targets: Screen[] = ["home", "pick", "label", "train", "test"];

  return (
    <nav className="dev-nav">
      <p>Jump to:</p>
      <div className="dev-nav-buttons">
        {targets.map((target) => (
          <button
            key={target}
            type="button"
            className={screen === target ? "dev-nav-active" : undefined}
            onClick={() => onNavigate(target)}
          >
            {target}
          </button>
        ))}
      </div>
    </nav>
  );
}
