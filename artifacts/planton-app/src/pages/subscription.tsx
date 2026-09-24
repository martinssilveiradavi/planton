import { useMemo } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetCurrentUserQueryKey,
  useCancelMySubscription,
  useCreateMySubscription,
  useGetCurrentUser,
} from "@workspace/api-client-react";
import { Button } from "@workspace/planton-ds/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/planton-ds/components/ui/card";
import { Badge } from "@workspace/planton-ds/components/ui/badge";
import { toast } from "@workspace/planton-ds/hooks/use-toast";
import { AlertCircle, Check, Loader2, ShieldCheck } from "lucide-react";

const MONTHLY_AMOUNT = 129.9;

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function statusLabel(status?: string) {
  switch (status) {
    case "ATIVA":
      return "Ativa";
    case "PENDENTE":
      return "Aguardando pagamento";
    case "INADIMPLENTE":
      return "Pagamento pendente";
    case "CANCELADA":
      return "Cancelada";
    default:
      return "Ainda não assinada";
  }
}

export default function Subscription() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useGetCurrentUser({
    query: {
      queryKey: getGetCurrentUserQueryKey(),
      retry: false,
    },
  });
  const subscription = user?.subscription ?? null;

  const createSubscription = useCreateMySubscription({
    mutation: {
      onSuccess: (created) => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        if (created?.invoiceUrl) {
          window.open(created.invoiceUrl, "_blank", "noopener,noreferrer");
          toast({
            title: "Pagamento aberto",
            description: "Conclua o pagamento para liberar seu acesso.",
          });
        } else {
          toast({
            title: "Assinatura criada",
            description:
              "Aguardando o link de pagamento do Asaas. Atualize esta página em instantes.",
          });
        }
      },
      onError: (error) => {
        toast({
          title: "Não foi possível criar a assinatura",
          description:
            error instanceof Error
              ? error.message
              : "Verifique a configuração do pagamento e tente novamente.",
          variant: "destructive",
        });
      },
    },
  });

  const cancelSubscription = useCancelMySubscription({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        toast({
          title: "Assinatura cancelada",
          description: "Seu acesso foi encerrado e a cobrança recorrente foi cancelada.",
        });
      },
      onError: (error) => {
        toast({
          title: "Não foi possível cancelar",
          description:
            error instanceof Error ? error.message : "Tente novamente.",
          variant: "destructive",
        });
      },
    },
  });

  const amount = useMemo(
    () => subscription?.value ?? MONTHLY_AMOUNT,
    [subscription?.value],
  );
  const isActive = subscription?.status === "ATIVA";
  const invoiceUrl = subscription?.invoiceUrl;
  const hasInvoice = Boolean(invoiceUrl);
  const isPending = createSubscription.isPending || cancelSubscription.isPending;

  if (isLoading) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl items-center justify-center px-4 py-10">
      <Card className="w-full max-w-xl border-primary/20 shadow-sm">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Assinatura do Planton</CardTitle>
            <CardDescription className="mt-2">
              Tenha acesso às candidaturas e aos recursos para encontrar seus
              próximos plantões.
            </CardDescription>
          </div>
          {subscription && (
            <Badge
              variant={isActive ? "default" : "secondary"}
              className="mx-auto w-fit"
            >
              {statusLabel(subscription.status)}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-xl bg-muted/50 p-5 text-center">
            <p className="text-sm text-muted-foreground">Plano mensal</p>
            <p className="mt-1 text-4xl font-bold text-primary">
              {formatCurrency(amount)}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / mês
              </span>
            </p>
          </div>

          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <Check className="h-4 w-4 shrink-0 text-accent" />
              Candidate-se aos plantões disponíveis.
            </li>
            <li className="flex gap-2">
              <Check className="h-4 w-4 shrink-0 text-accent" />
              Receba recomendações personalizadas.
            </li>
            <li className="flex gap-2">
              <Check className="h-4 w-4 shrink-0 text-accent" />
              Pagamento recorrente mensal processado pelo Asaas.
            </li>
          </ul>

          {isActive ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-lg bg-accent/10 p-3 text-sm text-accent-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0" />
                Sua assinatura está ativa. Você já pode usar o aplicativo.
              </div>
              <Button asChild className="w-full">
                <Link href="/">Continuar para os plantões</Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-destructive"
                disabled={isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      "Deseja realmente cancelar sua assinatura mensal?",
                    )
                  ) {
                    cancelSubscription.mutate();
                  }
                }}
              >
                {cancelSubscription.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Cancelar assinatura
              </Button>
            </div>
          ) : hasInvoice ? (
            <div className="space-y-3">
              <a
                href={invoiceUrl ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <Button className="w-full" disabled={isPending}>
                  Abrir pagamento
                </Button>
              </a>
              <p className="text-center text-xs text-muted-foreground">
                Após o pagamento, o acesso será liberado automaticamente.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                className="w-full"
                disabled={isPending}
                onClick={() => createSubscription.mutate()}
              >
                {createSubscription.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {subscription
                  ? "Atualizar pagamento"
                  : `Assinar por ${formatCurrency(amount)}/mês`}
              </Button>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                O acesso é liberado após a confirmação do pagamento.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}