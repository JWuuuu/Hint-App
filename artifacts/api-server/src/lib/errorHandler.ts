import type { ErrorRequestHandler } from "express";
import { APIError } from "openai";
import { logger } from "./logger";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  logger.error({ err }, "Unhandled API error");

  if (err instanceof APIError) {
    res.status(err.status ?? 502).json({
      error: err.message,
      type: err.type,
      code: err.code,
    });
    return;
  }

  const message = err instanceof Error ? err.message : "Unexpected server error";
  res.status(500).json({ error: message });
};
