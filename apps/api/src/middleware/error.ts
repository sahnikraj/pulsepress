import type { NextFunction, Request, Response } from "express";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof Error) {
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: error.message
    });
  }

  return res.status(500).json({
    code: "INTERNAL_ERROR",
    message: "Unknown error"
  });
}
