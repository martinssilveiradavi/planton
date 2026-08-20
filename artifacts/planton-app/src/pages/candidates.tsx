import { useParams, Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@workspace/planton-ds/components/ui/button';
import { Badge } from '@workspace/planton-ds/components/ui/badge';
import { Skeleton } from '@workspace/planton-ds/components/ui/skeleton';
import {
  Card,
  CardContent,
} from '@workspace/planton-ds/components/ui/card';
import { Separator } from '@workspace/planton-ds/components/ui/separator';
import { toast } from '@workspace/planton-ds/hooks/use-toast';
import {
  useGetShift,
  useListShiftApplications,
  useUpdateApplication,
  getGetShiftQueryKey,
  getListShiftApplicationsQueryKey,
  Application,
} from '@workspace/api-client-react';
import {
  ChevronLeft, Users, CheckCircle2, XCircle, Loader2, AlertCircle
} from 'lucide-react';
import { formatRemuneration, formatDate } from '../components/shift-card';

function appStatusLabel(status: string) {
  switch (status) {
    case 'PENDENTE': return 'Pendente';
    case 'SELECIONADO': return 'Selecionado';
    case 'REJEITADO': return 'Rejeitado';
    default: return status;
  }
}

function appStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'PENDENTE': return 'secondary';
    case 'SELECIONADO': return 'default';
    case 'REJEITADO': return 'destructive';
    default: return 'outline';
  }
}

export default function Candidates() {
  const params = useParams<{ shiftId: string }>();
  const shiftId = Number(params.shiftId);
  const queryClient = useQueryClient();

  const { data: shift, isLoading: shiftLoading } = useGetShift(shiftId, {
    query: { queryKey: getGetShiftQueryKey(shiftId), enabled: !!shiftId },
  });

  const { data: applications, isLoading: appsLoading } = useListShiftApplications(shiftId, {
    query: {
      queryKey: getListShiftApplicationsQueryKey(shiftId),
      enabled: !!shiftId,
    },
  });

  const updateApplication = useUpdateApplication({
    mutation: {
      onSuccess: (_, variables) => {
        const newStatus = variables.data.status;
        toast({
          title:
            newStatus === 'SELECIONADO'
              ? 'Médico selecionado!'
              : 'Candidatura rejeitada',
        });
        queryClient.invalidateQueries({
          queryKey: getListShiftApplicationsQueryKey(shiftId),
        });
      },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar';
        toast({ title: 'Erro', description: message, variant: 'destructive' });
      },
    },
  });

  const isLoading = shiftLoading || appsLoading;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Back */}
      {shift && (
        <Link
          href={`/shifts/${shift.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          data-testid="link-back"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar ao plantão
        </Link>
      )}

      {/* Header */}
      {shiftLoading ? (
        <div className="space-y-2 mb-6">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : shift ? (
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-foreground">{shift.title}</h1>
              <p className="text-sm text-muted-foreground">
                {shift.specialty} — {shift.city}, {shift.state}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDate(shift.date)} · {shift.startTime}–{shift.endTime}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xl font-bold text-primary">
                {formatRemuneration(shift.remuneration)}
              </p>
              <p className="text-xs text-muted-foreground">
                {applications?.length ?? 0} candidato{(applications?.length ?? 0) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <Separator className="mb-6" />

      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Candidatos</h2>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : !applications || applications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold text-foreground mb-1">
              Nenhum candidato ainda
            </p>
            <p className="text-sm text-muted-foreground">
              Médicos ainda não se candidataram a este plantão
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app: Application) => (
            <div
              key={app.id}
              className="bg-card border border-border rounded-xl p-4"
              data-testid={`card-candidate-${app.id}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">
                    {app.doctorName ?? `Médico #${app.doctorId}`}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {app.doctorSpecialty && (
                      <p className="text-xs text-muted-foreground">
                        {app.doctorSpecialty}
                      </p>
                    )}
                    {app.doctorCrm && (
                      <Badge variant="outline" className="text-xs">
                        CRM {app.doctorCrm}
                      </Badge>
                    )}
                  </div>
                  {app.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      "{app.notes}"
                    </p>
                  )}
                </div>
                <Badge
                  className="rounded-full shrink-0"
                  variant={appStatusVariant(app.status)}
                >
                  {appStatusLabel(app.status)}
                </Badge>
              </div>

              {app.status === 'PENDENTE' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5 bg-accent hover:bg-accent/90 border-transparent"
                    disabled={updateApplication.isPending}
                    onClick={() =>
                      updateApplication.mutate({
                        id: app.id,
                        data: { status: 'SELECIONADO' },
                      })
                    }
                    data-testid={`button-selecionar-${app.id}`}
                  >
                    {updateApplication.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Selecionar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5"
                    disabled={updateApplication.isPending}
                    onClick={() =>
                      updateApplication.mutate({
                        id: app.id,
                        data: { status: 'REJEITADO' },
                      })
                    }
                    data-testid={`button-rejeitar-${app.id}`}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Rejeitar
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
