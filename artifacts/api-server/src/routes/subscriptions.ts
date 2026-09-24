import { Router, type IRouter, type Request, type Response } from "express";
import { AsaasError } from "../lib/asaas";
import { requireDoctor } from "../middlewares/auth";
import {
  cancelDoctorSubscription,
  createDoctorSubscription,
  formatSubscription,
  getDoctorSubscription,
} from "../services/subscriptions";

const router: IRouter = Router();

router.get(
  "/subscriptions/me",
  requireDoctor,
  async (req: Request, res: Response): Promise<void> => {
    const subscription = await getDoctorSubscription(req.appUserId!);
    res.json(formatSubscription(subscription));
  },
);

router.post(
  "/subscriptions",
  requireDoctor,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await createDoctorSubscription(req.appUserId!);
      res
        .status(result.created ? 201 : 200)
        .json(formatSubscription(result.subscription));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível criar a assinatura no Asaas";
      res
        .status(error instanceof AsaasError ? 502 : 500)
        .json({ error: message });
    }
  },
);

router.delete(
  "/subscriptions/me",
  requireDoctor,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const subscription = await cancelDoctorSubscription(req.appUserId!);
      res.json(formatSubscription(subscription));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível cancelar a assinatura no Asaas";
      res
        .status(error instanceof AsaasError ? 502 : 500)
        .json({ error: message });
    }
  },
);

export default router;