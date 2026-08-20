import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@workspace/planton-ds/components/ui/button';
import { Badge } from '@workspace/planton-ds/components/ui/badge';
import { Skeleton } from '@workspace/planton-ds/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/planton-ds/components/ui/card';
import { toast } from '@workspace/planton-ds/hooks/use-toast';
import { cn } from '@workspace/planton-ds/lib/utils';
import {
  useGetCurrentUser,
  useListShifts,
  useListApplications,
  useUpdateShift,
  getGetCurrentUserQueryKey,
  getListShiftsQueryKey,
  getListApplicationsQueryKey,
  Shift,
} from '@workspace/api-client-react';
import {
  Users, Plus, Eye, Edit, XCircle, Calendar, MapPin,
  Clock, Loader2, AlertCircle
} from 'lucide-react';
import { formatRemuneration, formatDate, statusLabel } from '../components/shift-card';

function statusBadgeClass(status: Shift['status']) {
  switch (status) {
    case 'ABERTO': return 'bg-accent text-accent-foreground border-transparent';
    case 'PREENCHIDO': return '';
    case 'CANCELADO': return 'bg-destructive text-destructive-foreground border-transparent';
    case 'ENCERRADO': return '';
    default: return '';
  }
}

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

export default function MyShifts() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: userLoading } = useGetCurrentUser({
    query: { queryKey: getGetCurrentUserQueryKey(), retry: false },
  });

  // Hospital: their published shifts
  const { data: hospitalShiftsData, isLoading: shiftsLoading } = useListShifts(
    undefined,
    {
      query: {
        queryKey: getListShiftsQueryKey(),
        enabled: currentUser?.type === 'hospital',
      },
    }
  );

  // Doctor: their applications
  const { data: applications, isLoading: appsLoading } = useListApplications({
    query: {
      queryKey: getListApplicationsQueryKey(),
      enabled: currentUser?.type === 'doctor',
    },
  });

  const updateShift = useUpdateShift({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListShiftsQueryKey() });
        toast({ title: 'Plantão atualizado' });
      },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar';
        toast({ title: 'Erro', description: message, variant: 'destructive' });
      },
    },
  });

  if (userLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Acesso restrito</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Faça login para ver seus plantões e candidaturas.
        </p>
        <Link href="/login">
          <Button>Fazer login</Button>
        </Link>
      </div>
    );
  }

  // Hospital view
  if (currentUser.type === 'hospital') {
    const myShifts = (hospitalShiftsData?.shifts ?? []).filter(
      (s) => s.hospitalId === currentUser.id
    );

    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Meus plantões</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie os plantões publicados pelo {currentUser.hospitalName || currentUser.name}
            </p>
          </div>
          <Link href="/publish">
            <Button className="gap-2" data-testid="button-new-shift">
              <Plus className="h-4 w-4" />
              Novo plantão
            </Button>
          </Link>
        </div>

        {shiftsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : myShifts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground mb-2">
                Nenhum plantão publicado
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Publique um plantão para encontrar médicos disponíveis
              </p>
              <Link href="/publish">
                <Button>Publicar plantão</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {myShifts.map((shift) => (
              <div
                key={shift.id}
                className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow"
                data-testid={`card-shift-${shift.id}`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground truncate">{shift.title}</p>
                      <Badge
                        className={cn('rounded-full text-xs shrink-0', statusBadgeClass(shift.status))}
                        variant={shift.status === 'ABERTO' ? 'default' : shift.status === 'CANCELADO' ? 'destructive' : 'secondary'}
                      >
                        {statusLabel(shift.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{shift.specialty}</p>
                  </div>
                  <p className="text-lg font-bold text-primary shrink-0">
                    {formatRemuneration(shift.remuneration)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(shift.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {shift.startTime}–{shift.endTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {shift.city}, {shift.state}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {shift.applicationsCount ?? 0} candidato{(shift.applicationsCount ?? 0) !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/candidates/${shift.id}`}>
                    <Button size="sm" variant="secondary" className="gap-1.5" data-testid={`button-ver-candidatos-${shift.id}`}>
                      <Users className="h-3.5 w-3.5" />
                      Ver candidatos
                    </Button>
                  </Link>
                  <Link href={`/shifts/${shift.id}`}>
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      Ver
                    </Button>
                  </Link>
                  {shift.status === 'ABERTO' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5"
                      disabled={updateShift.isPending}
                      onClick={() =>
                        updateShift.mutate({ id: shift.id, data: { status: 'ENCERRADO' } })
                      }
                      data-testid={`button-encerrar-${shift.id}`}
                    >
                      {updateShift.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      Encerrar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Doctor view
  const appList = applications ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Minhas candidaturas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhe o status das suas candidaturas a plantões
        </p>
      </div>

      {appsLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : appList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground mb-2">Nenhuma candidatura</p>
            <p className="text-sm text-muted-foreground mb-4">
              Explore plantões disponíveis e demonstre interesse
            </p>
            <Link href="/">
              <Button>Ver plantões</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appList.map((app) => (
            <div
              key={app.id}
              className="bg-card border border-border rounded-xl p-4"
              data-testid={`card-application-${app.id}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">
                    {app.shift?.title ?? `Plantão #${app.shiftId}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {app.shift?.hospitalName} — {app.shift?.specialty}
                  </p>
                </div>
                <Badge
                  className="shrink-0 rounded-full"
                  variant={appStatusVariant(app.status)}
                >
                  {appStatusLabel(app.status)}
                </Badge>
              </div>

              {app.shift && (
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(app.shift.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {app.shift.startTime}–{app.shift.endTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {app.shift.city}, {app.shift.state}
                  </span>
                  {app.shift.remuneration && (
                    <span className="font-semibold text-primary">
                      {formatRemuneration(app.shift.remuneration)}
                    </span>
                  )}
                </div>
              )}

              <Link href={`/shifts/${app.shiftId}`}>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  Ver plantão
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
