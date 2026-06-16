import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tarotRouter from "./tarot";
import hintRouter from "./hint";
import speechRouter from "./speech";
import profileRouter from "./profile";
import historyRouter from "./history";
import dailyReceiptsRouter from "./dailyReceipts";
import astrologyRouter from "./astrology";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tarotRouter);
router.use(hintRouter);
router.use(speechRouter);
router.use(profileRouter);
router.use(historyRouter);
router.use(dailyReceiptsRouter);
router.use(astrologyRouter);

export default router;
