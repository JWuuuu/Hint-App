import crypto from "node:crypto";
import { Router } from "express";
import * as z from "zod";
import {
  getAstroInterpretationProxy,
  getAstroProxyStatus,
  getGeoDetailsProxy,
  getNasaApodProxy,
  getNatalProxy,
  getSynastryProxy,
  getTimezoneProxy,
  getTransitsProxy,
} from "../modules/astrology/astroProxyService.js";
import {
  buildCompatibilityResult,
  calculateBirthChart,
  getAstrologyStatus,
  type BirthProfileInput,
  type CompatibilityResult,
} from "../modules/astrology/astrologyApiClient.js";

const router = Router();

const birthProfileSchema = z.object({
  userId: z.string().min(1).max(200).optional(),
  name: z.string().min(1).max(120).optional(),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z.string().max(40).optional(),
  birthCity: z.string().max(200).optional(),
  birthCountry: z.string().max(120).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  timezone: z.union([z.string().max(80), z.number().min(-14).max(14)]).optional(),
});

const astroProfileSchema = z.object({
  id: z.string().min(1).max(200).optional(),
  name: z.string().min(1).max(120).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z.string().max(40).optional(),
  birthPlace: z.string().min(1).max(200),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  timezone: z.string().max(80).optional(),
  timezoneOffset: z.number().min(-14).max(14).optional(),
});

const natalProxySchema = z.object({
  profile: astroProfileSchema,
});

const transitsProxySchema = z.object({
  profile: astroProfileSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const synastryProxySchema = z.object({
  userProfile: astroProfileSchema,
  partnerProfile: astroProfileSchema,
});

const geoDetailsSchema = z.object({
  place: z.string().min(1).max(160),
  maxRows: z.number().int().min(1).max(12).optional(),
});

const timezoneSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const interpretationSchema = z.object({
  kind: z.enum(["placement", "signs", "transit", "synastry", "reportPreview"]),
  data: z.record(z.string(), z.unknown()),
  tone: z.enum(["warm", "direct", "mirror"]).optional(),
});

const inviteSchema = z.object({
  createdByUserId: z.string().min(1).max(200),
  relationshipType: z.enum(["crush", "partner", "ex", "friend", "unclear"]).optional(),
  birthProfile: birthProfileSchema,
});

const inviteCompletionSchema = z.object({
  friendName: z.string().min(1).max(120).optional(),
  friendBirthProfile: birthProfileSchema,
  consent: z.boolean(),
});

type CompatibilityInvite = {
  id: string;
  token: string;
  createdByUserId: string;
  createdAt: string;
  expiresAt: string;
  status: "pending" | "completed" | "expired";
  relationshipType?: "crush" | "partner" | "ex" | "friend" | "unclear";
  birthProfile: BirthProfileInput;
  resultId?: string;
};

const invites = new Map<string, CompatibilityInvite>();
const compatibilityResults = new Map<string, CompatibilityResult>();

function safeInvite(invite: CompatibilityInvite) {
  return {
    id: invite.id,
    token: invite.token,
    createdByUserId: invite.createdByUserId,
    createdAt: invite.createdAt,
    expiresAt: invite.expiresAt,
    status: invite.status,
    relationshipType: invite.relationshipType,
    creatorName: invite.birthProfile.name,
    resultId: invite.resultId,
  };
}

function isExpired(invite: CompatibilityInvite) {
  return Date.parse(invite.expiresAt) <= Date.now();
}

function expiresInSevenDays() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString();
}

router.get("/astrology/status", (_req, res) => {
  res.json(getAstrologyStatus());
});

router.get("/astro/status", (_req, res) => {
  res.json(getAstroProxyStatus());
});

router.post("/astro/geo-details", async (req, res) => {
  const parsed = geoDetailsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid location search." });
    return;
  }

  res.json(await getGeoDetailsProxy(parsed.data.place, parsed.data.maxRows));
});

router.post("/astro/timezone", async (req, res) => {
  const parsed = timezoneSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid timezone request." });
    return;
  }

  res.json(await getTimezoneProxy(parsed.data.latitude, parsed.data.longitude, parsed.data.dateISO ?? parsed.data.date));
});

router.post("/astro/natal", async (req, res) => {
  const parsed = natalProxySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid birth profile." });
    return;
  }

  try {
    res.json(await getNatalProxy(parsed.data.profile));
  } catch {
    res.status(503).json({ error: "Natal chart calculation is unavailable right now." });
  }
});

router.post("/astro/transits", async (req, res) => {
  const parsed = transitsProxySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid transit request." });
    return;
  }

  const range = req.query.range === "weekly" ? "weekly" : "daily";
  try {
    res.json(await getTransitsProxy(parsed.data.profile, parsed.data.date ?? new Date().toISOString().slice(0, 10), range));
  } catch {
    res.status(503).json({ error: "Transit calculation is unavailable right now." });
  }
});

router.post("/astro/synastry", async (req, res) => {
  const parsed = synastryProxySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid synastry request." });
    return;
  }

  try {
    res.json(await getSynastryProxy(parsed.data.userProfile, parsed.data.partnerProfile));
  } catch {
    res.status(503).json({ error: "Synastry calculation is unavailable right now." });
  }
});

router.get("/visual/nasa/apod", async (req, res) => {
  const date = typeof req.query.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date) ? req.query.date : undefined;
  res.json(await getNasaApodProxy(date));
});

router.post("/ai/astro-interpretation", async (req, res) => {
  const parsed = interpretationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid interpretation request." });
    return;
  }

  res.json(await getAstroInterpretationProxy(parsed.data));
});

router.post("/astrology/birth-chart", async (req, res) => {
  const parsed = birthProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid birth profile." });
    return;
  }

  try {
    const chart = await calculateBirthChart(parsed.data);
    res.json(chart);
  } catch {
    res.status(503).json({ error: "Chart calculation is unavailable right now." });
  }
});

router.post("/astrology/recalculate-chart", async (req, res) => {
  const parsed = birthProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid birth profile." });
    return;
  }

  try {
    const chart = await calculateBirthChart(parsed.data, { force: true });
    res.json(chart);
  } catch {
    res.status(503).json({ error: "Chart calculation is unavailable right now." });
  }
});

router.post("/compatibility/invite", async (req, res) => {
  const parsed = inviteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid compatibility invite." });
    return;
  }

  const token = crypto.randomBytes(18).toString("base64url");
  const invite: CompatibilityInvite = {
    id: crypto.randomUUID(),
    token,
    createdByUserId: parsed.data.createdByUserId,
    createdAt: new Date().toISOString(),
    expiresAt: expiresInSevenDays(),
    status: "pending",
    relationshipType: parsed.data.relationshipType,
    birthProfile: parsed.data.birthProfile,
  };
  invites.set(token, invite);
  res.json(safeInvite(invite));
});

router.get("/compatibility/invite/:token", (req, res) => {
  const invite = invites.get(req.params.token);
  if (!invite) {
    res.status(404).json({ error: "Invite not found." });
    return;
  }
  if (isExpired(invite)) invite.status = "expired";
  res.json(safeInvite(invite));
});

router.post("/compatibility/invite/:token/complete", async (req, res) => {
  const invite = invites.get(req.params.token);
  if (!invite) {
    res.status(404).json({ error: "Invite not found." });
    return;
  }
  if (isExpired(invite)) {
    invite.status = "expired";
    res.status(410).json({ error: "Invite expired." });
    return;
  }

  const parsed = inviteCompletionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid compatibility response." });
    return;
  }
  if (!parsed.data.consent) {
    res.status(400).json({ error: "Consent is required to create a shared chart." });
    return;
  }

  try {
    const userChart = await calculateBirthChart(invite.birthProfile);
    const friendChart = await calculateBirthChart({
      ...parsed.data.friendBirthProfile,
      name: parsed.data.friendName ?? parsed.data.friendBirthProfile.name,
    });
    const result = buildCompatibilityResult(userChart, friendChart);
    compatibilityResults.set(result.id, result);
    invite.status = "completed";
    invite.resultId = result.id;
    res.json({ resultId: result.id, result });
  } catch {
    res.status(503).json({ error: "Compatibility calculation is unavailable right now." });
  }
});

router.get("/compatibility/:id", (req, res) => {
  const result = compatibilityResults.get(req.params.id);
  if (!result) {
    res.status(404).json({ error: "Compatibility result not found." });
    return;
  }
  res.json(result);
});

export default router;
