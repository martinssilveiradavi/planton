import { Router, type IRouter, type Request, type Response } from "express";
import { updatePaymentFromAsaasEvent } from "../services/payments";
import {
  updateSubscriptionFromPayment,
  updateSubscriptionStatus,
} from "../services/subscriptions";

const router: IRouter = Router();

function isAuthorized(req: Request) {
  const configuredToken = process.env.ASAAS_WEBHOOK_TOKEN?.trim();
  return Boolean(
    configuredToken &&
      req.header("asaas-access-token") === configuredToken,
  );
}

// POST /webhooks/asaas - receives payment status events from Asaas
router.post(
  "/webhooks/asaas",
  async (req: Request, res: Response): Promise<void> => {
    if (!process.env.ASAAS_WEBHOOK_TOKEN) {
      res.status(503).json({ error: "ASAAS_WEBHOOK_TOKEN não configurado" });
      return;
    }
    if (!isAuthorized(req)) {
      res.status(401).json({ error: "Webhook Asaas não autorizado" });
      return;
    }

    const event = req.body as {
      event?: string;
      payment?: {
        id?: string;
        status?: string;
        subscription?: string | null;
        invoiceUrl?: string | null;
        paymentDate?: string | null;
        confirmedDate?: string | null;
      };
      subscription?: {
        id?: string;
        status?: string;
        nextDueDate?: string | null;
      };
    };
    const payment = event.payment;
    const subscriptionEvent = event.subscription;
    let matched = false;

    if (payment?.id && payment.status) {
      const updatedPayment = await updatePaymentFromAsaasEvent({
        chargeId: payment.id,
        asaasStatus: payment.status,
        invoiceUrl: payment.invoiceUrl,
        paidAt: payment.paymentDate ?? payment.confirmedDate,
      });
      matched = Boolean(updatedPayment);

      if (payment.subscription) {
        const updatedSubscription =
          await updateSubscriptionFromPayment({
            subscriptionId: payment.subscription,
            paymentId: payment.id,
            paymentStatus: payment.status,
            invoiceUrl: payment.invoiceUrl,
            paidAt: payment.paymentDate ?? payment.confirmedDate,
          });
        matched = matched || Boolean(updatedSubscription);
      }
    }

    if (
      subscriptionEvent?.id &&
      subscriptionEvent.status &&
      event.event?.startsWith("SUBSCRIPTION_")
    ) {
      const updatedSubscription = await updateSubscriptionStatus({
        subscriptionId: subscriptionEvent.id,
        status: subscriptionEvent.status,
        nextDueDate: subscriptionEvent.nextDueDate,
      });
      matched = matched || Boolean(updatedSubscription);
    }

    if (!payment?.id && !subscriptionEvent?.id) {
      res.status(400).json({ error: "Evento Asaas inválido" });
      return;
    }
    res.status(200).json({ received: true, matched });
  },
);

export default router;