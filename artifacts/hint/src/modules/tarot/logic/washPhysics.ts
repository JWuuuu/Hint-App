import type { RitualCard } from "./createHiddenDeck";

export type WashPointer = {
  x: number;
  y: number;
  movementX: number;
  movementY: number;
  width: number;
  height: number;
  spinDirection: 1 | -1;
  forceScale?: number;
};

export type WashResult = {
  cards: RitualCard[];
  activeVisualIds: string[];
  movementScore: number;
};

const INNER_RADIUS = 160;
const OUTER_RADIUS = 500;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampFieldX(value: number) {
  return clamp(value, 10, 90);
}

function clampFieldY(value: number) {
  return clamp(value, 11, 89);
}

function isBaseLayer(card: RitualCard, index: number) {
  return card.washLayer === "base" || (!card.washLayer && index % 2 === 0);
}

function getHome(card: RitualCard) {
  return {
    x: card.homeX ?? card.x,
    y: card.homeY ?? card.y,
  };
}

function isInnerWashLane(index: number) {
  return index % 10 === 0 || index % 17 === 6 || index % 23 === 4;
}

function isMiddleWashLane(index: number) {
  return index % 4 === 0 || index % 7 === 3 || index % 13 === 5;
}

function getWashRadius(index: number, baseLayer: boolean, laneShift = 0) {
  const lane = (((index * 7) % 19) + laneShift + 19) % 19;
  const innerLane = isInnerWashLane(index);
  const middleLane = isMiddleWashLane(index);
  const shared = innerLane
    ? 13 + (index % 6) * 2.15
    : middleLane
      ? 25 + (lane % 8) * 2.55
      : 36 + lane * 1.08;
  const layerDrift = innerLane
    ? Math.sin(index * 1.27 + laneShift * 0.42) * 3.8
    : middleLane
      ? Math.sin(index * 1.09 + laneShift * 0.36) * (baseLayer ? 5.2 : 6.1)
      : baseLayer
        ? Math.sin(index * 1.27 + laneShift * 0.42) * 6.1
        : Math.cos(index * 1.19 + laneShift * 0.38) * 6.9;
  return clamp(shared + layerDrift, innerLane ? 10 : middleLane ? 21 : 32, 56);
}

function getRingPull(distance: number, desiredDistance: number, strength: number) {
  return clamp((desiredDistance - distance) * strength, -1.15, 1.15);
}

function projectWithForwardSpin(
  x: number,
  y: number,
  tangentX: number,
  tangentY: number,
  radialX: number,
  radialY: number,
) {
  const forwardTangent = Math.max(0, x * tangentX + y * tangentY);
  const radial = x * radialX + y * radialY;

  return {
    x: tangentX * forwardTangent + radialX * radial,
    y: tangentY * forwardTangent + radialY * radial,
  };
}

function rotateAroundWashCenter(x: number, y: number, turn: number) {
  const dx = x - 50;
  const dy = y - 52;
  const cos = Math.cos(turn);
  const sin = Math.sin(turn);

  return {
    x: 50 + dx * cos - dy * sin,
    y: 52 + dx * sin + dy * cos,
  };
}

function normalizeAngle(value: number) {
  let angle = value;
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function keepForwardOrbit(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  spinDirection: 1 | -1,
  minTurn: number,
) {
  const clampedToX = clampFieldX(toX);
  const clampedToY = clampFieldY(toY);
  const fromDx = fromX - 50;
  const fromDy = fromY - 52;
  const toDx = clampedToX - 50;
  const toDy = clampedToY - 52;
  const fromDistance = Math.hypot(fromDx, fromDy);
  const toDistance = Math.hypot(toDx, toDy);

  if (fromDistance < 1.8 || toDistance < 1.8) {
    return {
      x: clampedToX,
      y: clampedToY,
    };
  }

  const fromAngle = Math.atan2(fromDy, fromDx);
  const toAngle = Math.atan2(toDy, toDx);
  const signedTurn = normalizeAngle(toAngle - fromAngle) * spinDirection;

  if (signedTurn >= minTurn) {
    return {
      x: clampedToX,
      y: clampedToY,
    };
  }

  const enforcedAngle = fromAngle + spinDirection * minTurn;

  return {
    x: clampFieldX(50 + Math.cos(enforcedAngle) * toDistance),
    y: clampFieldY(52 + Math.sin(enforcedAngle) * toDistance),
  };
}

function getOrbitPoint(
  card: RitualCard,
  index: number,
  baseLayer: boolean,
  orbitTurn = 0,
) {
  const home = getHome(card);
  const homeDx = home.x - 50;
  const homeDy = home.y - 52;
  const homeDistance = Math.hypot(homeDx, homeDy);
  const seedAngle = index * 2.399963229728653;
  const innerLane = isInnerWashLane(index);
  const angle = homeDistance > 3
    ? Math.atan2(homeDy, homeDx) + Math.sin(index * 1.37) * 0.52
    : seedAngle;
  const turnedAngle = angle + orbitTurn + Math.sin(index * 0.73) * 0.16;
  const laneShift = Math.sin(orbitTurn * 4.4 + index * 1.11 + card.rotate * 0.025 + card.x * 0.035 + card.y * 0.022) * 7.2;
  const radius = getWashRadius(index, baseLayer, laneShift) * (baseLayer ? 1.0 : 1.05);
  const xScale = innerLane
    ? 1.08 + Math.sin(index * 0.43) * 0.08
    : 1.18 + Math.sin(index * 0.43) * 0.10;
  const yScale = innerLane
    ? 0.94 + Math.cos(index * 0.51) * 0.08
    : 1.04 + Math.cos(index * 0.51) * 0.10;
  return {
    x: 50 + Math.cos(turnedAngle) * radius * xScale + Math.sin(seedAngle * 1.7) * 3.1,
    y: 52 + Math.sin(turnedAngle) * radius * yScale + Math.cos(seedAngle * 1.3) * 2.6,
  };
}

export function applyWashForce(
  ritualCards: readonly RitualCard[],
  pointer: WashPointer,
): WashResult {
  const activeVisualIds: string[] = [];
  let movementScore = 0;
  const pointerSpeed = Math.min(18, Math.max(1, Math.hypot(pointer.movementX, pointer.movementY)));
  const forceScale = clamp(pointer.forceScale ?? 1, 0.12, 1);
  const tableCenterX = pointer.width / 2;
  const tableCenterY = pointer.height / 2;
  const spinDirection = pointer.spinDirection;

  const cards = ritualCards.map((card, index) => {
    const baseLayer = isBaseLayer(card, index);
    const home = getHome(card);
    const cardX = (card.x / 100) * pointer.width;
    const cardY = (card.y / 100) * pointer.height;
    const distance = Math.hypot(cardX - pointer.x, cardY - pointer.y);
    const centerDx = cardX - tableCenterX;
    const centerDy = cardY - tableCenterY;
    const centerDistance = Math.max(22, Math.hypot(centerDx, centerDy));
    const tangentX = (-centerDy / centerDistance) * spinDirection;
    const tangentY = (centerDx / centerDistance) * spinDirection;
    const tableDx = card.x - 50;
    const tableDy = card.y - 52;
    const tableDistance = Math.max(1, Math.hypot(tableDx, tableDy));
    const tableRadialX = tableDx / tableDistance;
    const tableRadialY = tableDy / tableDistance;
    const manualLaneShift = Math.sin(index * 0.91 + card.rotate * 0.038 + card.x * 0.052 + card.y * 0.031 + pointerSpeed * 0.26) * 8.6;
    const desiredDistance = getWashRadius(index, baseLayer, manualLaneShift);
    const orbitPoint = getOrbitPoint(card, index, baseLayer);
    const centerPush = Math.max(0, desiredDistance * 0.72 - tableDistance) * (baseLayer ? 0.018 : 0.023);
    const ringPull = getRingPull(tableDistance, desiredDistance, baseLayer ? 0.018 : 0.016) + centerPush;
    const ringPullX = tableRadialX * ringPull;
    const ringPullY = tableRadialY * ringPull;
    const rawOrbitPullX = (orbitPoint.x - card.x) * (baseLayer ? 0.010 : 0.013);
    const rawOrbitPullY = (orbitPoint.y - card.y) * (baseLayer ? 0.010 : 0.013);
    const orbitPull = projectWithForwardSpin(
      rawOrbitPullX,
      rawOrbitPullY,
      tangentX,
      tangentY,
      tableRadialX,
      tableRadialY,
    );
    const rawHomePullX = (home.x - card.x) * (baseLayer ? 0.005 : 0.0028);
    const rawHomePullY = (home.y - card.y) * (baseLayer ? 0.005 : 0.0028);
    const homePull = projectWithForwardSpin(
      rawHomePullX,
      rawHomePullY,
      tangentX,
      tangentY,
      tableRadialX,
      tableRadialY,
    );
    const currentVelocityX = card.velocityX ?? 0;
    const currentVelocityY = card.velocityY ?? 0;
    const currentVelocityRotate = card.velocityRotate ?? 0;
    const carriedVelocity = projectWithForwardSpin(
      currentVelocityX,
      currentVelocityY,
      tangentX,
      tangentY,
      tableRadialX,
      tableRadialY,
    );

    if (distance > OUTER_RADIUS) {
      const ambient = (pointerSpeed > 2 ? 0.052 : 0.018) * forceScale;
      const drift = (baseLayer ? 0.095 : 0.092) * forceScale;
      const velocityCarry = baseLayer ? 0.22 : 0.24;
      const rotationCarry = baseLayer ? 0.22 : 0.18;
      const move = projectWithForwardSpin(
        carriedVelocity.x * velocityCarry + tangentX * drift + ringPullX * 0.38 + orbitPull.x * 0.78 + homePull.x * 0.46 + (Math.random() - 0.5) * ambient,
        carriedVelocity.y * velocityCarry + tangentY * drift + ringPullY * 0.38 + orbitPull.y * 0.78 + homePull.y * 0.46 + (Math.random() - 0.5) * ambient,
        tangentX,
        tangentY,
        tableRadialX,
        tableRadialY,
      );
      const nextPoint = rotateAroundWashCenter(
        card.x + move.x,
        card.y + move.y,
        spinDirection * 0.012,
      );
      const finalPoint = keepForwardOrbit(
        card.x,
        card.y,
        nextPoint.x,
        nextPoint.y,
        spinDirection,
        0.0038,
      );
      return {
        ...card,
        x: finalPoint.x,
        y: finalPoint.y,
        rotate: clamp(card.rotate + currentVelocityRotate * rotationCarry + spinDirection * (baseLayer ? 0.10 : 0.13), -64, 64),
        rotation: clamp(card.rotation + currentVelocityRotate * rotationCarry + spinDirection * (baseLayer ? 0.10 : 0.13), -64, 64),
        velocityX: carriedVelocity.x * (baseLayer ? 0.46 : 0.52) + tangentX * (baseLayer ? 0.014 : 0.018),
        velocityY: carriedVelocity.y * (baseLayer ? 0.46 : 0.52) + tangentY * (baseLayer ? 0.013 : 0.017),
        velocityRotate: currentVelocityRotate * (baseLayer ? 0.46 : 0.52) + spinDirection * (baseLayer ? 0.014 : 0.018),
        lift: (card.lift ?? 0) * 0.62,
      };
    }

    const near = distance <= INNER_RADIUS;
    const falloff = Math.max(0, 1 - Math.max(0, distance - INNER_RADIUS) / (OUTER_RADIUS - INNER_RADIUS));
    const impact = near ? 1 : falloff;
    const strength = (baseLayer
      ? near
        ? 6.6 + Math.random() * 6.2
        : 3.8 + Math.random() * 4.4 * falloff
      : near
        ? 11.8 + Math.random() * 10.2
        : 5.9 + Math.random() * 6.4 * falloff) * forceScale;
    const handBlend = near ? 1 : 0.62 + falloff * 0.28;
    const layerGrip = baseLayer ? 0.48 : 0.58;
    const crossMix = Math.sin(index * 1.53 + pointer.x * 0.018 + pointer.y * 0.014 + card.rotate * 0.041);
    const slipMix = Math.cos(index * 1.87 + pointer.x * 0.024 - pointer.y * 0.018 + card.y * 0.033);
    const radialMixX = tableRadialX * crossMix * (near ? 9.0 : 5.8 * falloff) * forceScale;
    const radialMixY = tableRadialY * crossMix * (near ? 7.4 : 4.8 * falloff) * forceScale;
    const crossTangentX = -tangentY * slipMix * (near ? 4.6 : 3.1 * falloff) * forceScale;
    const crossTangentY = tangentX * slipMix * (near ? 4.6 : 3.1 * falloff) * forceScale;
    const dx = tangentX * strength * handBlend * layerGrip + radialMixX + crossTangentX;
    const dy = tangentY * strength * handBlend * layerGrip + radialMixY + crossTangentY;
    const rotateDelta = (baseLayer
      ? near ? 1.35 + Math.random() * 1.9 : 0.62 + Math.random() * 1.2
      : near ? 2.7 + Math.random() * 3.1 : 1.1 + Math.random() * 2.1) * spinDirection * forceScale;

    activeVisualIds.push(card.visualId);
    movementScore += Math.max(0.38, impact) * (near ? 1.55 : 0.72) * (baseLayer ? 0.68 : 0.88);

    const forceX = (dx / pointer.width) * 100;
    const forceY = (dy / pointer.height) * 100;
    const forceMove = projectWithForwardSpin(
      forceX,
      forceY,
      tangentX,
      tangentY,
      tableRadialX,
      tableRadialY,
    );
    const nextVelocityX = carriedVelocity.x * (baseLayer ? 0.34 : 0.36) + forceMove.x * (baseLayer ? 0.23 : 0.32);
    const nextVelocityY = carriedVelocity.y * (baseLayer ? 0.34 : 0.36) + forceMove.y * (baseLayer ? 0.23 : 0.32);
    const nextVelocityRotate = currentVelocityRotate * (baseLayer ? 0.28 : 0.28) + rotateDelta * (baseLayer ? 0.12 : 0.15) + pointerSpeed * (baseLayer ? 0.0024 : 0.0037) * spinDirection;
    const rotation = clamp(card.rotate + rotateDelta + pointerSpeed * (baseLayer ? 0.0015 : 0.0025) * spinDirection, -64, 64);
    const move = projectWithForwardSpin(
      forceMove.x + ringPullX * 0.28 + orbitPull.x * 1.18 + homePull.x * 0.52,
      forceMove.y + ringPullY * 0.28 + orbitPull.y * 1.18 + homePull.y * 0.52,
      tangentX,
      tangentY,
      tableRadialX,
      tableRadialY,
    );
    const nextPoint = rotateAroundWashCenter(
      card.x + move.x,
      card.y + move.y,
      spinDirection * (near ? 0.018 : 0.013),
    );
    const finalPoint = keepForwardOrbit(
      card.x,
      card.y,
      nextPoint.x,
      nextPoint.y,
      spinDirection,
      near ? 0.0054 : 0.0038,
    );

    return {
      ...card,
      x: finalPoint.x,
      y: finalPoint.y,
      rotate: rotation,
      rotation,
      velocityX: nextVelocityX,
      velocityY: nextVelocityY,
      velocityRotate: nextVelocityRotate,
      lift: near ? (baseLayer ? 0.12 : 0.36) : (card.lift ?? 0) * 0.7,
    };
  });

  return { cards, activeVisualIds, movementScore };
}

export function loosenDeckForWash(ritualCards: readonly RitualCard[]): RitualCard[] {
  return ritualCards.map((card, index) => {
    const baseLayer = isBaseLayer(card, index);
    const innerLane = isInnerWashLane(index);
    const home = getHome(card);
    const orbitPoint = getOrbitPoint(card, index, baseLayer);
    const angle = Math.atan2(card.y - 52, card.x - 50) + (index % 9 - 4) * 0.04;
    const distance = Math.hypot(card.x - 50, card.y - 52);
    const laneShift = Math.sin(index * 1.21 + card.rotate * 0.03 + card.x * 0.04 + card.y * 0.025) * 8.0;
    const desiredDistance = getWashRadius(index, baseLayer, laneShift);
    const centerPush = Math.max(0, desiredDistance * 0.66 - distance) * (innerLane ? 0.12 : 0.16);
    const radial = clamp(
      (desiredDistance - distance) * (innerLane ? 0.092 : baseLayer ? 0.118 : 0.104) + centerPush,
      innerLane ? -1.8 : -3.8,
      innerLane ? 3.9 : 5.7,
    )
      + (Math.random() - 0.5) * (innerLane ? 0.9 : baseLayer ? 1.5 : 1.9);
    const tangent = innerLane
      ? 1.65 + Math.random() * 1.55
      : baseLayer
        ? 2.45 + Math.random() * 2.35
        : 3.05 + Math.random() * 2.75;
    const rotation = clamp(card.rotate + (Math.random() - 0.5) * (baseLayer ? 4.5 : 6.5), -58, 58);
    const orbitBlend = innerLane
      ? baseLayer
        ? 0.68
        : 0.72
      : baseLayer
        ? 0.48
        : 0.54;
    const spreadX =
      card.x +
      (orbitPoint.x - card.x) * orbitBlend +
      (home.x - card.x) * (baseLayer ? 0.0008 : 0.0004) +
      Math.cos(angle) * radial -
      Math.sin(angle) * tangent;
    const spreadY =
      card.y +
      (orbitPoint.y - card.y) * orbitBlend +
      (home.y - card.y) * (baseLayer ? 0.0008 : 0.0004) +
      Math.sin(angle) * radial +
      Math.cos(angle) * tangent;
    const opened = rotateAroundWashCenter(
      spreadX,
      spreadY,
      0.020 + (index % 5) * 0.002,
    );

    return {
      ...card,
      x: clampFieldX(opened.x),
      y: clampFieldY(opened.y),
      rotate: rotation,
      rotation,
      velocityX: Math.cos(angle + Math.PI / 2) * (baseLayer ? 0.11 + Math.random() * 0.08 : 0.14 + Math.random() * 0.12),
      velocityY: Math.sin(angle + Math.PI / 2) * (baseLayer ? 0.11 + Math.random() * 0.08 : 0.14 + Math.random() * 0.12),
      velocityRotate: (baseLayer ? 0.085 + Math.random() * 0.07 : 0.12 + Math.random() * 0.11),
      lift: baseLayer ? 0 : 0.16,
      zIndex: baseLayer ? index : 120 + index,
    };
  });
}

export function applyTableCurrent(
  ritualCards: readonly RitualCard[],
  tick: number,
  intensity = 1,
  spinDirection: 1 | -1 = 1,
): RitualCard[] {
  const pulse = 0.82 + Math.sin(tick / 860) * 0.12 + Math.sin(tick / 1540) * 0.08;

  return ritualCards.map((card, index) => {
    const baseLayer = isBaseLayer(card, index);
    const home = getHome(card);
    const orbitTurn = spinDirection * tick / (baseLayer ? 17000 : 14200);
    const orbitPoint = getOrbitPoint(card, index, baseLayer, orbitTurn);
    const dx = card.x - 50;
    const dy = card.y - 52;
    const distance = Math.max(8, Math.hypot(dx, dy));
    const tangentX = (-dy / distance) * spinDirection;
    const tangentY = (dx / distance) * spinDirection;
    const radialX = dx / distance;
    const radialY = dy / distance;
    const band = baseLayer ? 0.22 + ((index % 9) / 62) : 0.30 + ((index % 11) / 48);
    const current = intensity * pulse * band;
    const laneShift = Math.sin(tick / 1680 + index * 1.17 + card.rotate * 0.022) * 10.4;
    const desiredDistance = getWashRadius(index, baseLayer, laneShift);
    const centerPush = Math.max(0, desiredDistance * 0.72 - distance) * (baseLayer ? 0.018 : 0.023);
    const ringPull = getRingPull(distance, desiredDistance, baseLayer ? 0.019 : 0.016) + centerPush;
    const orbitPull = projectWithForwardSpin(
      (orbitPoint.x - card.x) * (baseLayer ? 0.005 : 0.0068),
      (orbitPoint.y - card.y) * (baseLayer ? 0.005 : 0.0068),
      tangentX,
      tangentY,
      radialX,
      radialY,
    );
    const homePull = projectWithForwardSpin(
      (home.x - card.x) * (baseLayer ? 0.0018 : 0.001),
      (home.y - card.y) * (baseLayer ? 0.0018 : 0.001),
      tangentX,
      tangentY,
      radialX,
      radialY,
    );
    const velocityCarry = baseLayer ? 0.18 : 0.24;
    const carriedVelocity = projectWithForwardSpin(
      card.velocityX ?? 0,
      card.velocityY ?? 0,
      tangentX,
      tangentY,
      radialX,
      radialY,
    );
    const crossPhase = tick / (baseLayer ? 1850 : 1580) + index * 0.67;
    const reversePhase = tick / (baseLayer ? 2500 : 2140) - index * 0.49;
    const laneCross =
      Math.sin(crossPhase) *
      Math.cos(reversePhase) *
      current *
      (baseLayer ? 0.082 : 0.118);
    const fold = Math.sin(tick / 2100 + index * 1.43 + card.x * 0.034) * current;
    const radialLaneMotion = laneCross + fold * (baseLayer ? 0.034 : 0.050);
    const rotation = clamp(
      card.rotate
        + (card.velocityRotate ?? 0) * (baseLayer ? 0.13 : 0.15)
        + spinDirection * current * (baseLayer ? 0.074 : 0.098)
        + fold * (baseLayer ? 0.030 : 0.046),
      -64,
      64,
    );
    const move = projectWithForwardSpin(
      carriedVelocity.x * velocityCarry
        + tangentX * current * (baseLayer ? 0.072 : 0.090)
        + radialX * ringPull * 0.50
        + orbitPull.x * 1.36
        + homePull.x * 0.58
        + radialX * radialLaneMotion,
      carriedVelocity.y * velocityCarry
        + tangentY * current * (baseLayer ? 0.068 : 0.084)
        + radialY * ringPull * 0.50
        + orbitPull.y * 1.36
        + homePull.y * 0.58
        + radialY * radialLaneMotion,
      tangentX,
      tangentY,
      radialX,
      radialY,
    );
    const nextPoint = rotateAroundWashCenter(
      card.x + move.x,
      card.y + move.y,
      spinDirection * current * 0.112,
    );
    const finalPoint = keepForwardOrbit(
      card.x,
      card.y,
      nextPoint.x,
      nextPoint.y,
      spinDirection,
      0.0064 + current * 0.014,
    );

    return {
      ...card,
      x: finalPoint.x,
      y: finalPoint.y,
      rotate: rotation,
      rotation,
      velocityX:
        carriedVelocity.x * (baseLayer ? 0.34 : 0.39) +
        tangentX * current * (baseLayer ? 0.010 : 0.013) +
        radialX * radialLaneMotion * (baseLayer ? 0.006 : 0.008),
      velocityY:
        carriedVelocity.y * (baseLayer ? 0.34 : 0.39) +
        tangentY * current * (baseLayer ? 0.010 : 0.013) +
        radialY * radialLaneMotion * (baseLayer ? 0.006 : 0.008),
      velocityRotate: (card.velocityRotate ?? 0) * (baseLayer ? 0.34 : 0.39) + spinDirection * current * (baseLayer ? 0.008 : 0.011),
      lift: (card.lift ?? 0) * 0.58,
      zIndex: baseLayer ? index : 120 + index,
    };
  });
}

export function applyAutoWashWave(
  ritualCards: readonly RitualCard[],
  elapsedMs: number,
): RitualCard[] {
  const direction = 1;
  const phase = elapsedMs / 1000;
  const wave = 1.58 + Math.sin(phase * Math.PI * 4.2) * 0.56;

  return ritualCards.map((card, index) => {
    const baseLayer = isBaseLayer(card, index);
    const home = getHome(card);
    const orbitPoint = getOrbitPoint(card, index, baseLayer);
    const dx = card.x - 50;
    const dy = card.y - 52;
    const distance = Math.max(4, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx);
    const tangent = angle + direction * Math.PI / 2;
    const ringOffset = Math.sin(phase * 9.2 + index * 0.41) * 1.22;
    const laneShift = Math.sin(phase * 10.4 + index * 1.09 + card.rotate * 0.028) * 13.4;
    const desiredDistance = getWashRadius(index, baseLayer, laneShift);
    const ringPull = getRingPull(distance, desiredDistance, baseLayer ? 0.020 : 0.016);
    const orbitPullX = (orbitPoint.x - card.x) * (baseLayer ? 0.034 : 0.044);
    const orbitPullY = (orbitPoint.y - card.y) * (baseLayer ? 0.034 : 0.044);
    const force = (baseLayer ? 1.02 + (index % 7) * 0.046 : 1.38 + (index % 13) * 0.052) * wave;
    const rotation = clamp(
      card.rotate
        + direction * (baseLayer ? 0.82 + (index % 5) * 0.056 : 1.20 + (index % 7) * 0.082)
        + Math.sin(phase * 7.4 + index) * (baseLayer ? 0.22 : 0.36),
      -62,
      62,
    );

    return {
      ...card,
      x: clampFieldX(
        card.x
          + Math.cos(tangent) * force
          + Math.cos(angle) * ringPull * 0.12
          + orbitPullX
          + Math.cos(angle + ringOffset) * (baseLayer ? 0.42 : 0.35)
          + (home.x - card.x) * (baseLayer ? 0.005 : 0.002),
      ),
      y: clampFieldY(
        card.y
          + Math.sin(tangent) * force
          + Math.sin(angle) * ringPull * 0.12
          + orbitPullY
          + Math.sin(angle + ringOffset) * (baseLayer ? 0.36 : 0.31)
          + (home.y - card.y) * (baseLayer ? 0.005 : 0.002),
      ),
      rotate: rotation,
      rotation,
      velocityX: Math.cos(tangent) * force * (baseLayer ? 0.18 : 0.23),
      velocityY: Math.sin(tangent) * force * (baseLayer ? 0.18 : 0.23),
      velocityRotate: direction * (baseLayer ? 0.24 + (index % 5) * 0.026 : 0.34 + (index % 5) * 0.036),
      lift: 0,
      zIndex: baseLayer ? index : 120 + index,
    };
  });
}

export function gatherDeckToCenter(ritualCards: readonly RitualCard[]): RitualCard[] {
  const distances = ritualCards.map((card) => Math.hypot(card.x - 50, card.y - 52));
  const maxDistance = Math.max(...distances, 1);

  return ritualCards.map((card, index) => {
    const distance = distances[index] ?? 0;
    const outsideFirstDelay = 1 - distance / maxDistance;
    const row = index % 13;
    const stack = Math.floor(index / 13);
    const rotation = (row - 6) * 0.9 + Math.sin(index * 1.47) * 1.4;
    return {
      ...card,
      x: 50 + (row - 6) * 0.16 + Math.sin(index * 1.31) * 1.05,
      y: 52 - stack * 0.12 + Math.cos(index * 1.17) * 0.62,
      rotate: rotation,
      rotation,
      velocityX: 0,
      velocityY: 0,
      velocityRotate: 0,
      lift: 0,
      gatherDelay: outsideFirstDelay * 0.24 + (index % 6) * 0.014,
      zIndex: index,
    };
  });
}

export function squareDeckAtCenter(ritualCards: readonly RitualCard[]): RitualCard[] {
  return ritualCards.map((card, index) => {
    const rotation = (index % 9 - 4) * 0.24;
    return {
      ...card,
      x: 50 + (index % 11 - 5) * 0.048,
      y: 52 - (index % 22) * 0.046,
      rotate: rotation,
      rotation,
      velocityX: 0,
      velocityY: 0,
      velocityRotate: 0,
      lift: 0,
      gatherDelay: (index % 7) * 0.012,
      zIndex: index,
    };
  });
}

export function cutDeckIntoPackets(
  ritualCards: readonly RitualCard[],
  direction: 1 | -1 = 1,
  pass = 0,
): RitualCard[] {
  const cutRatio = pass % 2 === 0 ? 0.42 : 0.58;
  const cutIndex = Math.floor(ritualCards.length * cutRatio);

  return ritualCards.map((card, index) => {
    const isLiftedPacket = index < cutIndex;
    const packet = isLiftedPacket ? 0 : 1;
    const packetStart = packet === 0 ? 0 : cutIndex;
    const packetIndex = index - packetStart;
    const packetSize = packet === 0 ? cutIndex : ritualCards.length - cutIndex;
    const packetDepth = packetSize <= 1 ? 0 : packetIndex / (packetSize - 1);
    const packetSide = isLiftedPacket ? direction : -direction;
    const edge = packetIndex % 9;
    const passLift = pass % 2 === 0 ? 1 : -1;
    const thickness = packetDepth * (isLiftedPacket ? 3.4 : 2.8);
    const packetBaseX =
      50 + packetSide * (isLiftedPacket ? 14.2 : 6.1) + passLift * 1.05;
    const packetBaseY =
      52 + (isLiftedPacket ? -6.2 : 3.8) + pass * 0.42;
    const rotation =
      packetSide * (isLiftedPacket ? 2.1 : 0.62) +
      passLift * (isLiftedPacket ? 0.26 : -0.12) +
      (edge - 4) * 0.018;

    return {
      ...card,
      x: packetBaseX + packetSide * packetDepth * 1.75 + (edge - 4) * 0.026,
      y: packetBaseY + thickness + Math.sin(packetIndex * 0.64) * 0.08,
      rotate: rotation,
      rotation,
      velocityX: 0,
      velocityY: 0,
      velocityRotate: 0,
      lift: isLiftedPacket ? 1 : 0,
      gatherDelay: packetIndex * 0.0018 + packet * 0.034 + pass * 0.026,
      zIndex: isLiftedPacket ? 420 + pass * 90 + (packetSize - packetIndex) : 90 + (packetSize - packetIndex),
    };
  });
}

export function transferCutPacket(
  ritualCards: readonly RitualCard[],
  direction: 1 | -1 = 1,
  pass = 0,
): RitualCard[] {
  const cutRatio = pass % 2 === 0 ? 0.42 : 0.58;
  const cutIndex = Math.floor(ritualCards.length * cutRatio);

  return ritualCards.map((card, index) => {
    const lifted = index < cutIndex;
    const packet = lifted ? 0 : 1;
    const packetStart = packet === 0 ? 0 : cutIndex;
    const packetIndex = index - packetStart;
    const packetSize = lifted ? cutIndex : ritualCards.length - cutIndex;
    const edge = packetIndex % 9;
    const depth = packetSize <= 1 ? 0 : packetIndex / (packetSize - 1);
    const passLift = pass % 2 === 0 ? 1 : -1;
    const liftedSlide = -direction * (7.8 + depth * 1.2) + passLift * 0.68;
    const lowerSlide = direction * (5.2 + depth * 0.7) - passLift * 0.32;
    const rotation =
      (lifted ? -direction * 0.86 : direction * 0.48) +
      passLift * (lifted ? -0.18 : 0.12) +
      (edge - 4) * 0.014;

    return {
      ...card,
      x: 50 + (lifted ? liftedSlide : lowerSlide) + (edge - 4) * 0.018,
      y: 52 + (lifted ? 2.2 : -2.2) + depth * (lifted ? 3.2 : 2.8) + pass * 0.34,
      rotate: rotation,
      rotation,
      velocityX: 0,
      velocityY: 0,
      velocityRotate: 0,
      lift: lifted ? 0.1 : 0.72,
      gatherDelay: packetIndex * 0.002 + (lifted ? 0.018 : 0.004) + pass * 0.02,
      zIndex: lifted ? 150 + (packetSize - packetIndex) : 520 + pass * 90 + (packetSize - packetIndex),
    };
  });
}

export function mergeCutDeckAtCenter(ritualCards: readonly RitualCard[]): RitualCard[] {
  return ritualCards.map((card, index) => {
    const rotation = (index % 7 - 3) * 0.07;
    const depth = index / Math.max(1, ritualCards.length - 1);

    return {
      ...card,
      x: 50 + (index % 8 - 3.5) * 0.018,
      y: 52 - depth * 1.45,
      rotate: rotation,
      rotation,
      velocityX: 0,
      velocityY: 0,
      velocityRotate: 0,
      lift: 0,
      gatherDelay: (index % 6) * 0.008,
      zIndex: index,
    };
  });
}

export function settleWashedDeck(
  ritualCards: readonly RitualCard[],
  spinDirection: 1 | -1 = 1,
): RitualCard[] {
  return ritualCards.map((card, index) => {
    const baseLayer = isBaseLayer(card, index);
    const home = getHome(card);
    const orbitPoint = getOrbitPoint(card, index, baseLayer);
    const dx = card.x - 50;
    const dy = card.y - 52;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const radialX = dx / distance;
    const radialY = dy / distance;
    const tangentX = -radialY * spinDirection;
    const tangentY = radialX * spinDirection;
    const laneShift = Math.sin(index * 1.21 + card.rotate * 0.025 + card.x * 0.04 + card.y * 0.025) * 5.2;
    const desiredDistance = getWashRadius(index, baseLayer, laneShift);
    const centerPush = Math.max(0, desiredDistance * 0.70 - distance) * (baseLayer ? 0.007 : 0.010);
    const ringPull = getRingPull(distance, desiredDistance, baseLayer ? 0.010 : 0.008) + centerPush;
    const velocity = projectWithForwardSpin(
      (card.velocityX ?? 0) * (baseLayer ? 0.64 : 0.62),
      (card.velocityY ?? 0) * (baseLayer ? 0.64 : 0.62),
      tangentX,
      tangentY,
      radialX,
      radialY,
    );
    const velocityRotate = (card.velocityRotate ?? 0) * (baseLayer ? 0.58 : 0.54);
    const rotation = clamp(card.rotate + velocityRotate, -58, 58);
    const move = projectWithForwardSpin(
      velocity.x +
        radialX * ringPull * 0.22 +
        (orbitPoint.x - card.x) * (baseLayer ? 0.0022 : 0.0028) +
        (home.x - card.x) * (baseLayer ? 0.00025 : 0.00018),
      velocity.y +
        radialY * ringPull * 0.22 +
        (orbitPoint.y - card.y) * (baseLayer ? 0.0022 : 0.0028) +
        (home.y - card.y) * (baseLayer ? 0.00025 : 0.00018),
      tangentX,
      tangentY,
      radialX,
      radialY,
    );
    const nextPoint = rotateAroundWashCenter(
      card.x + move.x,
      card.y + move.y,
      spinDirection * 0.0075,
    );
    const finalPoint = keepForwardOrbit(
      card.x,
      card.y,
      nextPoint.x,
      nextPoint.y,
      spinDirection,
      0.0036,
    );

    return {
      ...card,
      x: finalPoint.x,
      y: finalPoint.y,
      rotate: rotation,
      rotation,
      velocityX: velocity.x,
      velocityY: velocity.y,
      velocityRotate,
      lift: (card.lift ?? 0) * 0.52,
    };
  });
}
