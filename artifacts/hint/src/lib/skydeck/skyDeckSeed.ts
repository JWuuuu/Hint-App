export function toISODate(value: Date | string = new Date()): string {
  if (typeof value === "string") return value.slice(0, 10);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function stableHash(input: string): number {
  let value = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

export function createSkyDeckSeed({
  userId = "guest",
  isoDate = toISODate(),
  birthProfileId = "general",
}: {
  userId?: string;
  isoDate?: string;
  birthProfileId?: string;
} = {}) {
  const seed = `skydeck:${userId}:${isoDate}:${birthProfileId}`;
  return {
    seed,
    hash: stableHash(seed),
    isoDate,
  };
}

export function seededScore(seed: string, key: string, min = 48, max = 94): number {
  const range = Math.max(1, max - min);
  return min + (stableHash(`${seed}:${key}`) % (range + 1));
}
