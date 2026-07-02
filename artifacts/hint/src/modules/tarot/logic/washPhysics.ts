import type { RitualCard } from "./createHiddenDeck";

export type WashPointer = {
  x: number;
  y: number;
  movementX: number;
  movementY: number;
  width: number;
  height: number;
  spinDirection: 1 | -1;
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
  return clamp(value, 8, 92);
}

function clampFieldY(value: number) {
  return clamp(value, 10, 90);
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

function getWashRadius(index: number, baseLayer: boolean, laneShift = 0) {
  const lane = ((index % 17) + laneShift + 17) % 17;
  const shared = 10 + lane * 2.75;
  const layerDrift = baseLayer
    ? Math.sin(index * 1.27 + laneShift * 0.42) * 10.8
    : Math.cos(index * 1.19 + laneShift * 0.38) * 12.2;
  return clamp(shared + layerDrift, 7, 66);
}

function getRingPull(distance: number, desiredDistance: number, strength: number) {
  return clamp((desiredDistance - distance) * strength, -1.15, 1.15);
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
  const angle = homeDistance > 3
    ? Math.atan2(homeDy, homeDx) + Math.sin(index * 1.37) * 0.52
    : seedAngle;
  const turnedAngle = angle + orbitTurn + Math.sin(index * 0.73) * 0.16;
  const laneShift = Math.sin(orbitTurn * 4.4 + index * 1.11 + card.rotate * 0.025 + card.x * 0.035 + card.y * 0.022) * 7.2;
  const radius = getWashRadius(index, baseLayer, laneShift);
  const xScale = 1.58 + Math.sin(index * 0.43) * 0.16;
  const yScale = 1.02 + Math.cos(index * 0.51) * 0.13;
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
    const ringPull = getRingPull(tableDistance, desiredDistance, baseLayer ? 0.016 : 0.014);
    const ringPullX = tableRadialX * ringPull;
    const ringPullY = tableRadialY * ringPull;
    const orbitPullX = (orbitPoint.x - card.x) * (baseLayer ? 0.010 : 0.013);
    const orbitPullY = (orbitPoint.y - card.y) * (baseLayer ? 0.010 : 0.013);
    const homePullX = (home.x - card.x) * (baseLayer ? 0.025 : 0.012);
    const homePullY = (home.y - card.y) * (baseLayer ? 0.025 : 0.012);
    const currentVelocityX = card.velocityX ?? 0;
    const currentVelocityY = card.velocityY ?? 0;
    const currentVelocityRotate = card.velocityRotate ?? 0;

    if (distance > OUTER_RADIUS) {
      const ambient = pointerSpeed > 2 ? 0.052 : 0.018;
      const drift = baseLayer ? 0.095 : 0.092;
      const velocityCarry = baseLayer ? 0.22 : 0.24;
      const rotationCarry = baseLayer ? 0.22 : 0.18;
      return {
        ...card,
        x: clampFieldX(card.x + currentVelocityX * velocityCarry + tangentX * drift + ringPullX * 0.25 + orbitPullX * 0.62 + homePullX + (Math.random() - 0.5) * ambient),
        y: clampFieldY(card.y + currentVelocityY * velocityCarry + tangentY * drift + ringPullY * 0.25 + orbitPullY * 0.62 + homePullY + (Math.random() - 0.5) * ambient),
        rotate: clamp(card.rotate + currentVelocityRotate * rotationCarry + spinDirection * (baseLayer ? 0.10 : 0.13), -64, 64),
        rotation: clamp(card.rotation + currentVelocityRotate * rotationCarry + spinDirection * (baseLayer ? 0.10 : 0.13), -64, 64),
        velocityX: currentVelocityX * (baseLayer ? 0.46 : 0.52) + tangentX * (baseLayer ? 0.014 : 0.018),
        velocityY: currentVelocityY * (baseLayer ? 0.46 : 0.52) + tangentY * (baseLayer ? 0.013 : 0.017),
        velocityRotate: currentVelocityRotate * (baseLayer ? 0.46 : 0.52) + spinDirection * (baseLayer ? 0.014 : 0.018),
        lift: 0,
      };
    }

    const near = distance <= INNER_RADIUS;
    const falloff = Math.max(0, 1 - Math.max(0, distance - INNER_RADIUS) / (OUTER_RADIUS - INNER_RADIUS));
    const impact = near ? 1 : falloff;
    const strength = baseLayer
      ? near
        ? 6.6 + Math.random() * 6.2
        : 3.8 + Math.random() * 4.4 * falloff
      : near
        ? 11.8 + Math.random() * 10.2
        : 5.9 + Math.random() * 6.4 * falloff;
    const handBlend = near ? 1 : 0.62 + falloff * 0.28;
    const layerGrip = baseLayer ? 0.48 : 0.58;
    const crossMix = Math.sin(index * 1.53 + pointer.x * 0.018 + pointer.y * 0.014 + card.rotate * 0.041);
    const slipMix = Math.cos(index * 1.87 + pointer.x * 0.024 - pointer.y * 0.018 + card.y * 0.033);
    const radialMixX = tableRadialX * crossMix * (near ? 9.0 : 5.8 * falloff);
    const radialMixY = tableRadialY * crossMix * (near ? 7.4 : 4.8 * falloff);
    const crossTangentX = -tangentY * slipMix * (near ? 4.6 : 3.1 * falloff);
    const crossTangentY = tangentX * slipMix * (near ? 4.6 : 3.1 * falloff);
    const dx = tangentX * strength * handBlend * layerGrip + radialMixX + crossTangentX;
    const dy = tangentY * strength * handBlend * layerGrip + radialMixY + crossTangentY;
    const rotateDelta = (baseLayer
      ? near ? 1.35 + Math.random() * 1.9 : 0.62 + Math.random() * 1.2
      : near ? 2.7 + Math.random() * 3.1 : 1.1 + Math.random() * 2.1) * spinDirection;

    activeVisualIds.push(card.visualId);
    movementScore += Math.max(0.38, impact) * (near ? 1.55 : 0.72) * (baseLayer ? 0.68 : 0.88);

    const forceX = (dx / pointer.width) * 100;
    const forceY = (dy / pointer.height) * 100;
    const nextVelocityX = currentVelocityX * (baseLayer ? 0.34 : 0.36) + forceX * (baseLayer ? 0.23 : 0.32);
    const nextVelocityY = currentVelocityY * (baseLayer ? 0.34 : 0.36) + forceY * (baseLayer ? 0.23 : 0.32);
    const nextVelocityRotate = currentVelocityRotate * (baseLayer ? 0.28 : 0.28) + rotateDelta * (baseLayer ? 0.12 : 0.15) + pointerSpeed * (baseLayer ? 0.0024 : 0.0037) * spinDirection;
    const rotation = clamp(card.rotate + rotateDelta + pointerSpeed * (baseLayer ? 0.0015 : 0.0025) * spinDirection, -64, 64);

    return {
      ...card,
      x: clampFieldX(card.x + forceX + ringPullX * 0.18 + orbitPullX * 1.1 + homePullX),
      y: clampFieldY(card.y + forceY + ringPullY * 0.18 + orbitPullY * 1.1 + homePullY),
      rotate: rotation,
      rotation,
      velocityX: nextVelocityX,
      velocityY: nextVelocityY,
      velocityRotate: nextVelocityRotate,
      lift: 0,
    };
  });

  return { cards, activeVisualIds, movementScore };
}

export function loosenDeckForWash(ritualCards: readonly RitualCard[]): RitualCard[] {
  return ritualCards.map((card, index) => {
    const baseLayer = isBaseLayer(card, index);
    const home = getHome(card);
    const orbitPoint = getOrbitPoint(card, index, baseLayer);
    const angle = Math.atan2(card.y - 52, card.x - 50) + (index % 9 - 4) * 0.04;
    const distance = Math.hypot(card.x - 50, card.y - 52);
    const laneShift = Math.sin(index * 1.21 + card.rotate * 0.03 + card.x * 0.04 + card.y * 0.025) * 8.0;
    const desiredDistance = getWashRadius(index, baseLayer, laneShift);
    const radial = clamp(
      (desiredDistance - distance) * (baseLayer ? 0.085 : 0.072),
      -2.8,
      2.8,
    )
      + (Math.random() - 0.5) * (baseLayer ? 1.4 : 1.7);
    const tangent = baseLayer ? 1.3 + Math.random() * 2.1 : 1.75 + Math.random() * 2.85;
    const rotation = clamp(card.rotate + (Math.random() - 0.5) * (baseLayer ? 4.5 : 6.5), -58, 58);

    return {
      ...card,
      x: clampFieldX(card.x + (orbitPoint.x - card.x) * (baseLayer ? 0.070 : 0.090) + (home.x - card.x) * (baseLayer ? 0.003 : 0.0015) + Math.cos(angle) * radial - Math.sin(angle) * tangent),
      y: clampFieldY(card.y + (orbitPoint.y - card.y) * (baseLayer ? 0.070 : 0.090) + (home.y - card.y) * (baseLayer ? 0.003 : 0.0015) + Math.sin(angle) * radial + Math.cos(angle) * tangent),
      rotate: rotation,
      rotation,
      velocityX: Math.cos(angle + Math.PI / 2) * (baseLayer ? 0.075 + Math.random() * 0.090 : 0.110 + Math.random() * 0.140),
      velocityY: Math.sin(angle + Math.PI / 2) * (baseLayer ? 0.075 + Math.random() * 0.090 : 0.110 + Math.random() * 0.140),
      velocityRotate: (index % 2 === 0 ? 1 : -1) * (baseLayer ? 0.075 + Math.random() * 0.090 : 0.105 + Math.random() * 0.150),
      lift: 0,
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
  const pulse = 0.82 + Math.sin(tick / 360) * 0.26;

  return ritualCards.map((card, index) => {
    const baseLayer = isBaseLayer(card, index);
    const home = getHome(card);
    const orbitTurn = spinDirection * tick / (baseLayer ? 12000 : 9800);
    const orbitPoint = getOrbitPoint(card, index, baseLayer, orbitTurn);
    const dx = card.x - 50;
    const dy = card.y - 52;
    const distance = Math.max(6, Math.hypot(dx, dy));
    const tangentX = (-dy / distance) * spinDirection;
    const tangentY = (dx / distance) * spinDirection;
    const radialX = dx / distance;
    const radialY = dy / distance;
    const band = baseLayer ? 0.20 + ((index % 9) / 48) : 0.30 + ((index % 11) / 30);
    const current = intensity * pulse * band;
    const laneShift = Math.sin(tick / 920 + index * 1.17 + card.rotate * 0.022) * 7.2;
    const desiredDistance = getWashRadius(index, baseLayer, laneShift);
    const ringPull = getRingPull(distance, desiredDistance, baseLayer ? 0.010 : 0.008);
    const orbitPullX = (orbitPoint.x - card.x) * (baseLayer ? 0.003 : 0.004);
    const orbitPullY = (orbitPoint.y - card.y) * (baseLayer ? 0.003 : 0.004);
    const homePullX = (home.x - card.x) * (baseLayer ? 0.006 : 0.003);
    const homePullY = (home.y - card.y) * (baseLayer ? 0.006 : 0.003);
    const velocityCarry = baseLayer ? 0.22 : 0.30;
    const rotation = clamp(card.rotate + (card.velocityRotate ?? 0) * (baseLayer ? 0.16 : 0.18) + spinDirection * current * (baseLayer ? 0.090 : 0.120), -64, 64);

    return {
      ...card,
      x: clampFieldX(card.x + (card.velocityX ?? 0) * velocityCarry + tangentX * current * (baseLayer ? 0.058 : 0.070) + radialX * ringPull * 0.10 + orbitPullX * 1.15 + homePullX),
      y: clampFieldY(card.y + (card.velocityY ?? 0) * velocityCarry + tangentY * current * (baseLayer ? 0.054 : 0.066) + radialY * ringPull * 0.10 + orbitPullY * 1.15 + homePullY),
      rotate: rotation,
      rotation,
      velocityX: (card.velocityX ?? 0) * (baseLayer ? 0.42 : 0.48) + tangentX * current * (baseLayer ? 0.007 : 0.010),
      velocityY: (card.velocityY ?? 0) * (baseLayer ? 0.42 : 0.48) + tangentY * current * (baseLayer ? 0.007 : 0.010),
      velocityRotate: (card.velocityRotate ?? 0) * (baseLayer ? 0.42 : 0.48) + spinDirection * current * (baseLayer ? 0.006 : 0.009),
      lift: 0,
      zIndex: baseLayer ? index : 120 + index,
    };
  });
}

export function applyAutoWashWave(
  ritualCards: readonly RitualCard[],
  elapsedMs: number,
): RitualCard[] {
  const direction = -1;
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
    const thickness = packetDepth * (isLiftedPacket ? 5.0 : 4.2);
    const packetBaseX = 50 + packetSide * (isLiftedPacket ? 8.6 : 3.8) + passLift * 0.9;
    const packetBaseY = 52 + (isLiftedPacket ? -4.4 : 2.4) + (pass % 2) * 0.6;
    const rotation = packetSide * (isLiftedPacket ? 1.45 : 0.42) + (edge - 4) * 0.014;

    return {
      ...card,
      x: packetBaseX + packetSide * packetDepth * 1.34 + (edge - 4) * 0.018,
      y: packetBaseY + thickness + Math.sin(packetIndex * 0.64) * 0.05,
      rotate: rotation,
      rotation,
      velocityX: 0,
      velocityY: 0,
      velocityRotate: 0,
      lift: isLiftedPacket ? 1 : 0,
      gatherDelay: packetIndex * 0.0014 + packet * 0.026 + pass * 0.018,
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
    const liftedSlide = -direction * (3.2 + depth * 0.7) + passLift * 0.55;
    const lowerSlide = direction * (3.4 + depth * 0.48) - passLift * 0.25;
    const rotation = (lifted ? -direction * 0.58 : direction * 0.28) + (edge - 4) * 0.012;

    return {
      ...card,
      x: 50 + (lifted ? liftedSlide : lowerSlide) + (edge - 4) * 0.018,
      y: 52 + (lifted ? -1.35 : 1.35) + depth * (lifted ? 3.9 : 3.2) + pass * 0.38,
      rotate: rotation,
      rotation,
      velocityX: 0,
      velocityY: 0,
      velocityRotate: 0,
      lift: lifted ? 1 : 0,
      gatherDelay: packetIndex * 0.0017 + (lifted ? 0.018 : 0) + pass * 0.016,
      zIndex: lifted ? 520 + pass * 90 + (packetSize - packetIndex) : 120 + (packetSize - packetIndex),
    };
  });
}

export function mergeCutDeckAtCenter(ritualCards: readonly RitualCard[]): RitualCard[] {
  return ritualCards.map((card, index) => {
    const rotation = (index % 7 - 3) * 0.08;
    const depth = index / Math.max(1, ritualCards.length - 1);

    return {
      ...card,
      x: 50 + (index % 8 - 3.5) * 0.022,
      y: 52 - depth * 1.2,
      rotate: rotation,
      rotation,
      velocityX: 0,
      velocityY: 0,
      velocityRotate: 0,
      lift: 0,
      gatherDelay: (index % 6) * 0.006,
      zIndex: index,
    };
  });
}

export function settleWashedDeck(ritualCards: readonly RitualCard[]): RitualCard[] {
  return ritualCards.map((card, index) => {
    const baseLayer = isBaseLayer(card, index);
    const home = getHome(card);
    const orbitPoint = getOrbitPoint(card, index, baseLayer);
    const dx = card.x - 50;
    const dy = card.y - 52;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const laneShift = Math.sin(index * 1.21 + card.rotate * 0.025 + card.x * 0.04 + card.y * 0.025) * 5.2;
    const desiredDistance = getWashRadius(index, baseLayer, laneShift);
    const ringPull = getRingPull(distance, desiredDistance, baseLayer ? 0.004 : 0.003);
    const velocityX = (card.velocityX ?? 0) * (baseLayer ? 0.64 : 0.62);
    const velocityY = (card.velocityY ?? 0) * (baseLayer ? 0.64 : 0.62);
    const velocityRotate = (card.velocityRotate ?? 0) * (baseLayer ? 0.58 : 0.54);
    const rotation = clamp(card.rotate + velocityRotate, -58, 58);

    return {
      ...card,
      x: clampFieldX(card.x + velocityX + (dx / distance) * ringPull * 0.04 + (orbitPoint.x - card.x) * (baseLayer ? 0.0015 : 0.002) + (home.x - card.x) * (baseLayer ? 0.001 : 0.0007)),
      y: clampFieldY(card.y + velocityY + (dy / distance) * ringPull * 0.04 + (orbitPoint.y - card.y) * (baseLayer ? 0.0015 : 0.002) + (home.y - card.y) * (baseLayer ? 0.001 : 0.0007)),
      rotate: rotation,
      rotation,
      velocityX,
      velocityY,
      velocityRotate,
      lift: 0,
    };
  });
}
