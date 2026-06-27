import { useEffect, type RefObject } from "react";

type Point = readonly [number, number];
type Edge = readonly [number, number];

type ZodiacPattern = {
  id: string;
  nodes: readonly Point[];
  edges: readonly Edge[];
};

type Photon = {
  x: number;
  y: number;
  z: number;
  color: readonly [number, number, number];
  brightness: number;
  previousX: number | null;
  previousY: number | null;
};

type Constellation = {
  pattern: ZodiacPattern;
  startsAt: number;
  originX: number;
  originY: number;
  depth: number;
  scale: number;
  rotation: number;
  drift: number;
};

const FAR_DEPTH = 4.6;

// Zodiac linework normalized from astronomical constellation-line geometry.
const ZODIAC_PATTERNS: readonly ZodiacPattern[] = [
  { id: "Ari", nodes: [[0.41, 0.231], [-0.212, 0.011], [-0.394, -0.143], [-0.41, -0.231]], edges: [[0, 1], [1, 2], [2, 3]] },
  { id: "Tau", nodes: [[0.41, 0.164], [0.029, 0.05], [-0.016, 0.034], [-0.071, 0.028], [-0.051, 0.075], [-0.016, 0.115], [0.34, 0.348], [-0.189, -0.05], [-0.395, -0.118], [-0.173, -0.21], [-0.41, -0.135], [-0.336, -0.348]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [3, 7], [7, 8], [8, 9], [8, 10], [10, 11]] },
  { id: "Gem", nodes: [[-0.41, 0.004], [-0.337, 0.004], [-0.147, 0.099], [0.1, 0.285], [0.313, 0.344], [0.41, 0.204], [0.325, 0.163], [0.182, -0.015], [0.036, -0.066], [-0.203, -0.217], [-0.134, -0.344], [0.163, -0.212]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [7, 11]] },
  { id: "Cnc", nodes: [[0.22, -0.298], [0.075, -0.034], [0.061, 0.104], [0.096, 0.41], [-0.22, -0.41]], edges: [[0, 1], [1, 2], [2, 3], [1, 4]] },
  { id: "Leo", nodes: [[-0.26, -0.187], [-0.267, -0.059], [-0.183, 0.023], [0.177, 0.041], [0.41, -0.118], [0.178, -0.095], [-0.205, 0.118], [-0.364, 0.187], [-0.41, 0.127]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [2, 6], [6, 7], [7, 8]] },
  { id: "Vir", nodes: [[-0.41, 0.121], [-0.388, 0.034], [-0.255, -0.01], [-0.156, -0.025], [-0.028, -0.099], [0.042, -0.201], [0.273, -0.107], [0.396, -0.101], [-0.063, 0.201], [-0.093, 0.064], [0.085, -0.009], [0.207, 0.03], [0.41, 0.036]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [8, 9], [9, 3], [4, 10], [10, 11], [11, 12]] },
  { id: "Lib", nodes: [[-0.108, -0.229], [-0.24, 0.142], [0.023, 0.41], [0.209, 0.193], [0.224, -0.344], [0.24, -0.41]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [1, 3]] },
  { id: "Sco", nodes: [[-0.41, 0.163], [-0.399, 0.268], [-0.36, 0.353], [-0.242, 0.179], [-0.18, 0.154], [-0.131, 0.1], [-0.023, -0.084], [-0.01, -0.197], [0.01, -0.327], [0.143, -0.353], [0.333, -0.346], [0.41, -0.26], [0.372, -0.226], [0.305, -0.168]], edges: [[0, 1], [1, 2], [1, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13]] },
  { id: "Sgr", nodes: [[-0.325, -0.189], [-0.278, -0.12], [-0.3, 0.011], [-0.25, 0.138], [-0.352, 0.263], [0.143, -0.41], [0.152, -0.299], [-0.001, 0.009], [-0.123, 0.093], [0.378, -0.335], [0.41, -0.146], [0.382, 0.112], [0.244, 0.153], [0.162, 0.164], [0.092, 0.142], [-0.054, 0.112], [-0.41, -0.006], [0.03, 0.073], [0.014, 0.244], [0.05, 0.264], [0.107, 0.324], [0.136, 0.356], [0.136, 0.41], [-0.036, 0.262], [-0.062, 0.215]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [5, 6], [6, 7], [7, 8], [8, 3], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 8], [8, 2], [2, 16], [16, 1], [1, 7], [7, 17], [17, 15], [15, 18], [18, 19], [19, 20], [20, 21], [21, 22], [18, 23], [23, 24], [24, 15]] },
  { id: "Cap", nodes: [[-0.41, 0.264], [-0.379, 0.181], [-0.307, 0.07], [-0.149, -0.204], [-0.097, -0.264], [0.223, -0.099], [0.41, 0.132], [0.346, 0.112], [0.183, 0.106], [0.033, 0.091]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 0]] },
  { id: "Aqr", nodes: [[-0.41, 0.008], [-0.387, 0.017], [-0.203, 0.082], [-0.042, 0.18], [0.033, 0.16], [0.066, 0.186], [0.097, 0.184], [0.178, 0.044], [0.298, 0.013], [0.258, -0.212], [-0.039, -0.075], [0.01, 0.04], [0.05, 0.212], [0.321, -0.192], [0.41, -0.149]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [2, 10], [3, 11], [5, 12], [13, 8], [8, 14]] },
  { id: "Psc", nodes: [[0.188, 0.164], [0.178, 0.265], [0.214, 0.213], [0.177, 0.099], [0.269, -0.006], [0.333, -0.12], [0.41, -0.238], [0.371, -0.23], [0.315, -0.187], [0.263, -0.175], [0.188, -0.149], [0.138, -0.143], [0.072, -0.149], [-0.155, -0.162], [-0.244, -0.185], [-0.299, -0.171], [-0.334, -0.189], [-0.349, -0.228], [-0.304, -0.265], [-0.234, -0.256], [-0.214, -0.224], [-0.41, -0.218]], edges: [[0, 1], [1, 2], [2, 0], [0, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 16], [16, 17], [17, 18], [18, 19], [19, 20], [20, 14], [17, 21]] },
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const ease = (value: number) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

const randomGold = (): readonly [number, number, number] => {
  const roll = Math.random();
  if (roll < 0.5) return [255, 250, 238];
  if (roll < 0.76) return [242, 232, 210];
  if (roll < 0.92) return [230, 203, 142];
  if (roll < 0.98) return [199, 224, 230];
  return [230, 203, 142];
};

export function useSkyDeckPassby(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  firstLaunch: boolean,
  preview = false,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    let devicePixelRatio = 1;
    let animationFrame = 0;
    let startedAt = 0;
    let lastFrameAt = 0;
    let photons: Photon[] = [];
    let constellations: Constellation[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width || window.innerWidth || 390;
      height = rect.height || window.innerHeight || 844;
      devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * devicePixelRatio);
      canvas.height = Math.round(height * devicePixelRatio);
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };

    const recyclePhoton = (photon: Photon, focalLength: number) => {
      const maxX = (width / 2 / focalLength) * 1.46;
      const maxY = (height / 2 / focalLength) * 1.46;
      photon.z = FAR_DEPTH;
      photon.x = randomBetween(-maxX, maxX) * photon.z;
      photon.y = randomBetween(-maxY, maxY) * photon.z;
      photon.color = randomGold();
      photon.brightness = randomBetween(0.34, 1.08);
      photon.previousX = null;
      photon.previousY = null;
    };

    const reset = () => {
      window.cancelAnimationFrame(animationFrame);
      resize();

      const focalLength = Math.min(width, height) * 0.92;
      const maxX = (width / 2 / focalLength) * 1.44;
      const maxY = (height / 2 / focalLength) * 1.44;
      const photonCount = clamp(
        Math.round((width * height) / (firstLaunch ? 92 : 118)),
        1800,
        firstLaunch ? 5400 : 4200,
      );

      photons = Array.from({ length: photonCount }, () => {
        const z = randomBetween(0.32, FAR_DEPTH);
        return {
          x: randomBetween(-maxX, maxX) * z,
          y: randomBetween(-maxY, maxY) * z,
          z,
          color: randomGold(),
          brightness: randomBetween(0.34, 1.08),
          previousX: null,
          previousY: null,
        };
      });

      const timings = preview
        ? [0.18, 0.3, 0.42, 0.56, 0.7, 0.84, 1, 1.16, 1.34, 1.52, 1.7, 1.9]
        : firstLaunch
        ? [0.1, 0.17, 0.24, 0.32, 0.42, 0.52, 0.64, 0.76, 0.9, 1.04, 1.18, 1.34]
        : [0.06, 0.12, 0.18, 0.26, 0.34, 0.44, 0.54, 0.66, 0.78, 0.9, 1.02, 1.14];
      const slots: readonly Point[] = [
        [-0.62, -0.22],
        [0.18, -0.46],
        [0.72, 0.02],
        [-0.22, 0.38],
        [0.58, -0.34],
        [-0.72, 0.12],
        [0.04, 0.48],
        [0.88, 0.28],
        [-0.48, -0.44],
        [0.35, 0.36],
        [-0.86, 0.36],
        [0.78, -0.12],
      ];

      constellations = ZODIAC_PATTERNS.map((pattern, index) => {
        const slot = slots[index] ?? [0, 0];
        return {
          pattern,
          startsAt: timings[index] ?? 0,
          originX: slot[0] + randomBetween(-0.1, 0.1),
          originY: slot[1] + randomBetween(-0.09, 0.09),
          depth: randomBetween(3.8, 4.45),
          scale: randomBetween(0.4, 0.56),
          rotation: randomBetween(-0.55, 0.55),
          drift: randomBetween(-0.22, 0.22),
        };
      });

      startedAt = performance.now();
      lastFrameAt = startedAt;
      animationFrame = window.requestAnimationFrame(draw);
    };

    const draw = (now: number) => {
      const elapsed = (now - startedAt) / 1000;
      let delta = (now - lastFrameAt) / 1000;
      lastFrameAt = now;
      delta = Math.min(delta, 0.045);

      const centerX = width / 2;
      const centerY = height * 0.49;
      const focalLength = Math.min(width, height) * 0.92;
      const introAmount = ease(elapsed / 0.34);
      const rushStartsAt = preview ? 1.22 : firstLaunch ? 0.88 : 0.62;
      const rushProgress = ease((elapsed - rushStartsAt) / (preview ? 1.55 : firstLaunch ? 1.1 : 0.95));
      const rushAmount = elapsed > rushStartsAt
        ? 1
          + rushProgress * (preview ? 2.15 : firstLaunch ? 2.6 : 2.85)
          + (elapsed - rushStartsAt) * (preview ? 0.55 : firstLaunch ? 0.72 : 0.82)
        : 1;
      const speed = (1.82 + 0.2 * Math.sin(elapsed * 1.2)) * rushAmount;
      const driftX = 0.08 * Math.sin(elapsed * 1.05) + 0.05 * Math.sin(elapsed * 2.1 + 0.8);
      const driftY = 0.04 * Math.sin(elapsed * 0.82 + 1.3);

      context.fillStyle = "#040407";
      context.fillRect(0, 0, width, height);

      const fieldGlow = context.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        Math.max(width, height) * 0.72,
      );
      fieldGlow.addColorStop(0, `rgba(255, 240, 206, ${0.15 + rushProgress * 0.05})`);
      fieldGlow.addColorStop(0.22, `rgba(173, 210, 220, ${0.07 + rushProgress * 0.03})`);
      fieldGlow.addColorStop(0.54, `rgba(87, 63, 104, ${0.05 + rushProgress * 0.03})`);
      fieldGlow.addColorStop(1, "rgba(4, 4, 7, 0)");
      context.fillStyle = fieldGlow;
      context.fillRect(0, 0, width, height);

      const sideGlowStrength = introAmount * (0.07 + rushProgress * 0.1);
      const glowRadius = Math.max(width, height) * 0.68;
      const leftGlow = context.createRadialGradient(width * 0.04, centerY, 0, width * 0.04, centerY, glowRadius);
      leftGlow.addColorStop(0, `rgba(199, 224, 230, ${sideGlowStrength * 0.24})`);
      leftGlow.addColorStop(0.36, `rgba(236, 205, 151, ${sideGlowStrength * 0.12})`);
      leftGlow.addColorStop(1, "rgba(4, 4, 7, 0)");
      context.fillStyle = leftGlow;
      context.fillRect(0, 0, width, height);

      const rightGlow = context.createRadialGradient(width * 0.96, centerY * 0.92, 0, width * 0.96, centerY * 0.92, glowRadius);
      rightGlow.addColorStop(0, `rgba(242, 232, 210, ${sideGlowStrength * 0.2})`);
      rightGlow.addColorStop(0.34, `rgba(255, 238, 204, ${sideGlowStrength * 0.1})`);
      rightGlow.addColorStop(1, "rgba(4, 4, 7, 0)");
      context.fillStyle = rightGlow;
      context.fillRect(0, 0, width, height);

      for (const photon of photons) {
        photon.z -= speed * delta;
        photon.x -= driftX * delta;
        photon.y -= driftY * delta;

        if (photon.z < 0.17) recyclePhoton(photon, focalLength);

        const inverseDepth = 1 / photon.z;
        const screenX = centerX + photon.x * inverseDepth * focalLength;
        const screenY = centerY + photon.y * inverseDepth * focalLength;

        if (screenX < -90 || screenX > width + 90 || screenY < -90 || screenY > height + 90) {
          if (photon.z < 1.1) recyclePhoton(photon, focalLength);
          photon.previousX = screenX;
          photon.previousY = screenY;
          continue;
        }

        const depthAmount = 1 - photon.z / FAR_DEPTH;
        const [r, g, b] = photon.color;
        const centerPull = 1 - clamp(Math.hypot(screenX - centerX, screenY - centerY) / Math.max(width, height), 0, 1);
        const edgePull = clamp(Math.abs(screenX - centerX) / (width * 0.5), 0, 1);
        const alpha = (0.2 + depthAmount * 0.58 + centerPull * 0.1 + edgePull * (0.1 + rushProgress * 0.04)) * photon.brightness * introAmount;
        const size = clamp(inverseDepth * focalLength * 0.0026 * (1 + photon.brightness * 0.48 + rushProgress * 0.08), 0.24, 1.18);

        if (photon.previousX !== null && photon.previousY !== null) {
          const velocityX = screenX - photon.previousX;
          const velocityY = screenY - photon.previousY;
          if (velocityX * velocityX + velocityY * velocityY > 8) {
            context.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * (0.38 + rushProgress * 0.12)})`;
            context.lineWidth = clamp(size * 0.46, 0.18, 0.58);
            context.lineCap = "round";
            context.beginPath();
            context.moveTo(screenX - velocityX * (0.92 + rushProgress * 0.35), screenY - velocityY * (0.92 + rushProgress * 0.35));
            context.lineTo(screenX, screenY);
            context.stroke();
          }
        }

        if (photon.z < 0.68 || photon.brightness > 1) {
          const blur = clamp((0.68 - photon.z) / 0.68, 0, 1);
          const radius = size * (1.9 + blur * 3.1 + rushProgress * 0.38 + Math.max(0, photon.brightness - 0.9) * 1.4);
          const nearGlow = context.createRadialGradient(screenX, screenY, 0, screenX, screenY, radius);
          nearGlow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.42})`);
          nearGlow.addColorStop(0.42, `rgba(${r}, ${g}, ${b}, ${alpha * 0.14})`);
          nearGlow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          context.fillStyle = nearGlow;
          context.beginPath();
          context.arc(screenX, screenY, radius, 0, Math.PI * 2);
          context.fill();
        }

        context.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        context.fillRect(screenX, screenY, size, size);

        photon.previousX = screenX;
        photon.previousY = screenY;
      }

      for (const constellation of constellations) {
        const age = elapsed - constellation.startsAt;
        const constellationVisibleFor = preview ? 3.1 : firstLaunch ? 2.24 : 1.72;
        if (age < -0.2 || age > constellationVisibleFor) continue;

        const constellationForwardSpeed = preview
          ? 1.22 + rushProgress * 0.45
          : firstLaunch
          ? 1.38 + rushProgress * 0.48
          : 1.52 + rushProgress * 0.54;
        const z = constellation.depth - age * constellationForwardSpeed;
        if (z <= 0.16) continue;

        const inverseDepth = 1 / z;
        const renderInverseDepth = 1 / Math.max(z, 0.42);
        const passX = constellation.originX + Math.sin(age * 1.35 + constellation.drift) * 0.06 + age * constellation.drift * 0.2;
        const passY = constellation.originY + Math.cos(age * 1.12 + constellation.drift) * 0.03;
        const constellationX = centerX + passX * inverseDepth * focalLength;
        const constellationY = centerY + passY * inverseDepth * focalLength;
        const nearCameraBloom = ease((1.12 - z) / 0.78);
        const closePassFade = 1 - ease((0.34 - z) / 0.18);
        const timeFade = 1 - ease((age - constellationVisibleFor + 0.36) / 0.36);
        const visible = ease((age + 0.08) / 0.22) * closePassFade * timeFade * (1 + nearCameraBloom * 0.26);
        if (visible <= 0.01) continue;

        const baseSize = Math.min(width, height) * constellation.scale * renderInverseDepth * (1.14 + nearCameraBloom * 0.22);
        const sin = Math.sin(constellation.rotation);
        const cos = Math.cos(constellation.rotation);
        const points = constellation.pattern.nodes.map(([x, y]) => {
          const rotatedX = x * cos - y * sin;
          const rotatedY = x * sin + y * cos;
          return [constellationX + rotatedX * baseSize, constellationY + rotatedY * baseSize] as const;
        });
        const edgeBoost = constellationX < width * 0.16 || constellationX > width * 0.84 || constellationY < height * 0.15 || constellationY > height * 0.85 ? 0.9 : 1.04;
        const alpha = visible * edgeBoost;

        context.lineCap = "round";
        context.lineJoin = "round";
        for (const edge of constellation.pattern.edges) {
          const start = points[edge[0]];
          const end = points[edge[1]];
          context.strokeStyle = `rgba(190, 224, 230, ${alpha * (0.2 + nearCameraBloom * 0.06)})`;
          context.lineWidth = clamp(3.2 * renderInverseDepth, 1.2, 4.2);
          context.beginPath();
          context.moveTo(start[0], start[1]);
          context.lineTo(end[0], end[1]);
          context.stroke();

          context.strokeStyle = `rgba(255, 248, 229, ${alpha * (0.58 + nearCameraBloom * 0.1)})`;
          context.lineWidth = clamp(0.92 * renderInverseDepth, 0.52, 1.55);
          context.beginPath();
          context.moveTo(start[0], start[1]);
          context.lineTo(end[0], end[1]);
          context.stroke();
        }

        for (const point of points) {
          const radius = clamp(5.6 * renderInverseDepth * (1 + nearCameraBloom * 0.12), 3, 10);
          const starGlow = context.createRadialGradient(point[0], point[1], 0, point[0], point[1], radius);
          starGlow.addColorStop(0, `rgba(255, 254, 247, ${alpha * 0.84})`);
          starGlow.addColorStop(0.38, `rgba(199, 224, 230, ${alpha * 0.24})`);
          starGlow.addColorStop(0.72, `rgba(230, 203, 142, ${alpha * 0.1})`);
          starGlow.addColorStop(1, "rgba(199, 224, 230, 0)");
          context.fillStyle = starGlow;
          context.beginPath();
          context.arc(point[0], point[1], radius, 0, Math.PI * 2);
          context.fill();
          context.fillStyle = `rgba(255, 253, 245, ${alpha})`;
          context.beginPath();
          context.arc(point[0], point[1], clamp(1.05 * renderInverseDepth, 0.62, 1.6), 0, Math.PI * 2);
          context.fill();
        }
      }

      if (elapsed > rushStartsAt) {
        const flashAmount = clamp((elapsed - rushStartsAt) / (preview ? 0.82 : firstLaunch ? 0.56 : 0.44), 0, 1);
        const flash = context.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          Math.max(width, height) * 0.7,
        );
        flash.addColorStop(0, `rgba(255, 249, 232, ${flashAmount * 0.21})`);
        flash.addColorStop(0.18, `rgba(190, 224, 230, ${flashAmount * 0.11})`);
        flash.addColorStop(0.46, `rgba(230, 203, 142, ${flashAmount * 0.07})`);
        flash.addColorStop(1, "rgba(249, 242, 226, 0)");
        context.fillStyle = flash;
        context.fillRect(0, 0, width, height);
        context.fillStyle = `rgba(4, 4, 7, ${flashAmount * 0.14})`;
        context.fillRect(0, 0, width, height);
      }

      animationFrame = window.requestAnimationFrame(draw);
    };

    reset();
    window.addEventListener("resize", reset);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", reset);
    };
  }, [canvasRef, firstLaunch, preview]);
}
