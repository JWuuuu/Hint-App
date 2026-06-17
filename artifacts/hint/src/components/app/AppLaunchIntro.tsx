import { HintLogo } from "./HintLogo";
import type { HintTheme } from "./theme";
import "./app-launch-intro.css";

export function AppLaunchIntro({
  theme,
  leaving,
}: {
  theme: HintTheme;
  leaving: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      data-launch-theme={theme}
      data-leaving={leaving ? "true" : "false"}
      className="hint-launch-intro"
    >
      <div className="hint-launch-stars" />
      <div className="hint-launch-orbit-field">
        <span className="hint-launch-orbit hint-launch-orbit-a" />
        <span className="hint-launch-orbit hint-launch-orbit-b" />
        <span className="hint-launch-orbit hint-launch-orbit-c" />
        <span className="hint-launch-planet" />
        <span className="hint-launch-flare hint-launch-flare-a" />
        <span className="hint-launch-flare hint-launch-flare-b" />
      </div>

      <div className="hint-launch-card">
        <div className="hint-launch-logo-wrap">
          <HintLogo className="hint-launch-logo" />
          <span className="hint-launch-logo-halo" />
        </div>
        <div className="hint-launch-copy">
          <p className="hint-launch-kicker">Hint</p>
          <h1>Open the room within.</h1>
          <p>A private daily ritual for cards, sky, and the feeling underneath.</p>
        </div>
      </div>
    </div>
  );
}
