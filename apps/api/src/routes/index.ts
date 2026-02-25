import { Router } from "express";
import { authRouter } from "./auth";
import { siteRouter } from "./sites";
import { publicRouter } from "./public";
import { campaignsRouter } from "./campaigns";
import { metricsRouter } from "./metrics";
import { segmentsRouter } from "./segments";
import { automationsRouter } from "./automations";
import { webhooksRouter } from "./webhooks";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/sites", siteRouter);
apiRouter.use("/public", publicRouter);
apiRouter.use("/sites/:siteId/campaigns", campaignsRouter);
apiRouter.use("/sites/:siteId/campaigns", metricsRouter);
apiRouter.use("/sites/:siteId/segments", segmentsRouter);
apiRouter.use("/sites/:siteId/automations", automationsRouter);
apiRouter.use("/sites/:siteId/webhooks", webhooksRouter);
