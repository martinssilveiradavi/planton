import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import shiftsRouter from "./shifts";
import applicationsRouter from "./applications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(shiftsRouter);
router.use(applicationsRouter);

export default router;
