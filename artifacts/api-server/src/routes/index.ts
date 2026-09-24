import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import shiftsRouter from "./shifts";
import applicationsRouter from "./applications";
import aiRecommendationsRouter from "./ai-recommendations";
import webhooksRouter from "./webhooks";
import subscriptionsRouter from "./subscriptions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(shiftsRouter);
router.use(applicationsRouter);
router.use(aiRecommendationsRouter);
router.use(webhooksRouter);
router.use(subscriptionsRouter);

export default router;
