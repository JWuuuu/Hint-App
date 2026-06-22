import { useRef } from "react";
import type { HintTheme } from "./theme";
import { useSkyDeckPassby } from "./useSkyDeckPassby";
import "./app-launch-intro.css";

export type LaunchIntroVariant = "cinematic";

export function AppLaunchIntro({
  theme,
  leaving,
  firstLaunch,
  preview,
  variant,
}: {
  theme: HintTheme;
  leaving: boolean;
  firstLaunch: boolean;
  preview: boolean;
  variant: LaunchIntroVariant;
}) {
  const skyCanvasRef = useRef<HTMLCanvasElement>(null);
  useSkyDeckPassby(skyCanvasRef, firstLaunch, preview);

  return (
    <div
      aria-hidden="true"
      data-launch-theme={theme}
      data-leaving={leaving ? "true" : "false"}
      data-first-launch={firstLaunch ? "true" : "false"}
      data-preview={preview ? "true" : "false"}
      data-variant={variant}
      className="hint-launch-intro"
    >
      <canvas ref={skyCanvasRef} className="hint-launch-sky-canvas" />
      <div className="hint-launch-vignette" />
      <div className="hint-launch-sheen" />
      <div className="hint-launch-content">
        <div className="hint-launch-brand-stage" aria-hidden="true">
          <div className="hint-launch-mark">
            <svg className="hint-launch-h-logo" viewBox="0 0 220 220" fill="none">
              <defs>
                <linearGradient id="hintLaunchGold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f6eccb" />
                  <stop offset="50%" stopColor="#e6cb8e" />
                  <stop offset="100%" stopColor="#cba85f" />
                </linearGradient>
                <radialGradient id="hintLaunchStarGold" cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor="#fff7e6" />
                  <stop offset="45%" stopColor="#f0d49a" />
                  <stop offset="100%" stopColor="#cba85f" />
                </radialGradient>
              </defs>
              <rect className="hint-launch-h-stroke" x="42" y="34" width="64" height="152" rx="18" />
              <rect
                className="hint-launch-h-stroke hint-launch-h-stroke-second"
                x="120"
                y="34"
                width="64"
                height="152"
                rx="18"
              />
            </svg>
            <span className="hint-launch-light-streak hint-launch-light-streak-a" />
            <span className="hint-launch-light-streak hint-launch-light-streak-b" />
            <span className="hint-launch-light-streak hint-launch-light-streak-c" />
            <span className="hint-launch-light-streak hint-launch-light-streak-d" />
            <span className="hint-launch-light-streak hint-launch-light-streak-e" />
            <span className="hint-launch-h-glow" />
            <span className="hint-launch-h-ring" />
            <span className="hint-launch-h-ring hint-launch-h-ring-wide" />
            <span className="hint-launch-star-flare" />
            <svg className="hint-launch-star-svg" viewBox="-42 -42 84 84">
              <path
                className="hint-launch-star"
                d="M0 -38 C 3 -14, 7 -7, 34 0 C 7 7, 3 14, 0 38 C -3 14, -7 7, -34 0 C -7 -7, -3 -14, 0 -38 Z"
                fill="url(#hintLaunchStarGold)"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
