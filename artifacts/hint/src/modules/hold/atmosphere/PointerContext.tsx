/**
 * Global pointer tracking via framer-motion MotionValues — no React
 * re-renders on mouse movement. Used by RoomLight (ambient glow that
 * follows the finger/cursor) and any component that wants to bind to
 * cursor position cheaply.
 *
 * Position is normalized (0–1) of the viewport.
 */

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import {
  useMotionValue,
  useSpring,
  type MotionValue,
} from "framer-motion";

interface PointerCtx {
  /** Smoothed x (0–1). Lags slightly behind raw for cinematic feel. */
  x: MotionValue<number>;
  /** Smoothed y (0–1). */
  y: MotionValue<number>;
  /** True once the user has moved or touched. */
  active: MotionValue<number>;
}

const Ctx = createContext<PointerCtx | null>(null);

export function PointerProvider({ children }: { children: ReactNode }) {
  const rawX = useMotionValue(0.5);
  const rawY = useMotionValue(0.5);
  const active = useMotionValue(0);

  const x = useSpring(rawX, { stiffness: 60, damping: 22, mass: 1.1 });
  const y = useSpring(rawY, { stiffness: 60, damping: 22, mass: 1.1 });

  useEffect(() => {
    const w = typeof window === "undefined" ? null : window;
    if (!w) return;

    const setFromClient = (cx: number, cy: number) => {
      rawX.set(cx / w.innerWidth);
      rawY.set(cy / w.innerHeight);
      if (active.get() === 0) active.set(1);
    };

    const onMouse = (e: MouseEvent) => setFromClient(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) setFromClient(t.clientX, t.clientY);
    };

    w.addEventListener("mousemove", onMouse, { passive: true });
    w.addEventListener("touchmove", onTouch, { passive: true });
    w.addEventListener("touchstart", onTouch, { passive: true });
    return () => {
      w.removeEventListener("mousemove", onMouse);
      w.removeEventListener("touchmove", onTouch);
      w.removeEventListener("touchstart", onTouch);
    };
  }, [rawX, rawY, active]);

  return <Ctx.Provider value={{ x, y, active }}>{children}</Ctx.Provider>;
}

export function usePointer(): PointerCtx {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error("usePointer must be used inside <PointerProvider>");
  }
  return v;
}
