import "express-async-errors";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env";
import { apiRouter } from "./routes";
import { errorHandler } from "./middleware/error";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.webOrigin }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "pulsepress-api" });
});

app.use("/api/v1", apiRouter);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`PulsePress API running on http://localhost:${env.port}`);
});
