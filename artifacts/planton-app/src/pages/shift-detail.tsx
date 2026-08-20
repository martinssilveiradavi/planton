import { lazy, Suspense } from 'react';
import { useParams, Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@workspace/planton-ds/components/ui/button';
import { Badge } from '@workspace/planton-ds/components/ui/badge';
import { Separator } from '@workspace/planton-ds/components/ui/separator';
import { Skeleton } from '@workspace/planton-ds/components/ui/skeleton';
import { toast } from '@workspace/planton-ds/hooks/use-toast';
import { cn } from '@workspace/planton-ds/lib/utils';
import {
  useGetShift,
  useGetCurrentUser,
  useListApplications,
  useCreateApplication,
  getGetShiftQueryKey,
  getListApplicationsQueryKey,
  getGetCurrentUserQueryKey,
} from '@workspace/api-client-react';
import {
  MapPin, Calendar, Clock, Users, ChevronLeft, Building2,
  CheckCircle2, Loader2, AlertCircle, Edit
} from 'lucide-react';
import { formatRemuneration, formatDate, statusLabel } from '../components/shift-card';

const ShiftMap = lazy(() =>
  import('../components/shift-map').then((m) => ({ default: m.ShiftMap }))
);

function statusBadgeClass(status: string) {
  switch (status) {
    case 'ABERTO': return 'bg-accent text-accent-foreground border-transparent';
    case 'PREENCHIDO': return '';
    case 'CANCELADO': return 'bg-destructive text-destructive-foreground border-transparent';
    case 'ENCERRADO': return '';
    default: return '';
  }
}

function applicationStatusLabel(status: string) {
  switch (status) {
    case 'PENDENTE': return 'Candidatura enviada — Aguardando resposta';
    case 'SELECIONADO': return 'Parabens! Você foi selecionado';
    case 'REJEITADO': return 'Candidatura não aceita';
    default: return status;
  }
}

function applicationStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'PENDENTE': return 'secondary';
    case 'SELECIONADO': return 'default';
    case 'REJEITADO': return 'destructive';
    default: return 'outline';
  }
}

export default function ShiftDetail() {
  const params = useParams<{ id: string }>();
  const shiftId = Number(params.id);
  const queryClient = useQueryClient();

  const { data: shift, isLoading, isError } = useGetShift(shiftId, {
    query: { queryKey: getGetShiftQueryKey(shiftId), enabled: !!shiftId },
  });

  const { data: currentUser } = useGetCurrentUser({
    query: { queryKey: getGetCurrentUserQueryKey(), retry: false },
  });

  const { data: myApplications } = useListApplications({
    query: { queryKey: getListApplicationsQueryKey(), enabled: currentUser?.type === 'doctor' },
  });

  const myApplication = myApplications?.find((a) => a.shiftId === shiftId);
  const isOwner = currentUser?.type === 'hospital' && shift?.hospitalId === currentUser.id;

  const createApplication = useCreateApplication({
    mutation: {
      onSuccess: () => {
        toast({ title: 'Candidatura enviada!', description: 'O hospital será notificado.' });
        queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetShiftQueryKey(shiftId) });
      },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Erro ao se candidatar';
        toast({ title: 'Erro', description: message, variant: 'destructive' });
      },
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-48" />
        <div className="space-y-2 pt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !shift) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Plantão não encontrado</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Este plantão pode ter sido removido ou o link está incorreto.
        </p>
        <Link href="/">
          <Button variant="secondary">Ver outros plantões</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        data-testid="link-back"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="text-xl font-bold text-foreground leading-tight">{shift.title}</h1>
          <Badge
            className={cn('rounded-full shrink-0', statusBadgeClass(shift.status))}
            variant={shift.status === 'ABERTO' ? 'default' : shift.status === 'CANCELADO' ? 'destructive' : 'secondary'}
          >
            {statusLabel(shift.status)}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span className="text-sm font-medium">{shift.hospitalName}</span>
          <Badge variant="outline" className="text-xs">Verificado</Badge>
        </div>
      </div>

      {/* Remuneration */}
      <div className="bg-secondary rounded-xl p-4 mb-6">
        <p className="text-xs text-muted-foreground mb-1">Remuneração</p>
        <p className="text-3xl font-bold text-primary" data-testid="text-remuneration">
          {formatRemuneration(shift.remuneration)}
        </p>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Data</p>
            <p className="text-sm font-medium">{formatDate(shift.date)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Horário</p>
            <p className="text-sm font-medium">
              {shift.startTime} até {shift.endTime}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Endereço</p>
            <p className="text-sm font-medium">{shift.address}</p>
            <p className="text-xs text-muted-foreground">
              {shift.city}, {shift.state}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Candidatos</p>
            <p className="text-sm font-medium" data-testid="text-candidates-count">
              {shift.applicationsCount ?? 0} candidato
              {(shift.applicationsCount ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Specialty */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-1">Especialidade</p>
        <Badge variant="secondary">{shift.specialty}</Badge>
      </div>

      {/* Description */}
      {shift.description && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-foreground mb-2">Descrição</p>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {shift.description}
          </p>
        </div>
      )}

      {/* Requirements */}
      {shift.requirements && (
        <div className="mb-6">
          <p className="text-sm font-semibold text-foreground mb-2">Requisitos</p>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {shift.requirements}
          </p>
        </div>
      )}

      {/* Map */}
      {shift.latitude && shift.longitude && (
        <div className="mb-6">
          <p className="text-sm font-semibold text-foreground mb-2">Localização</p>
          <div style={{ height: '220px' }}>
            <Suspense
              fallback={
                <div className="h-full rounded-xl bg-muted animate-pulse" />
              }
            >
              <ShiftMap
                shifts={[shift]}
                center={[shift.latitude, shift.longitude]}
                zoom={14}
                className="h-full"
              />
            </Suspense>
          </div>
        </div>
      )}

      <Separator className="mb-6" />

      {/* CTA */}
      {isOwner ? (
        <div className="flex gap-3">
          <Link href={`/shifts/${shift.id}/edit`} className="flex-1">
            <Button variant="outline" className="w-full gap-2" data-testid="button-edit-shift">
              <Edit className="h-4 w-4" />
              Editar plantão
            </Button>
          </Link>
          <Link href={`/candidates/${shift.id}`} className="flex-1">
            <Button className="w-full gap-2" data-testid="button-ver-candidatos">
              <Users className="h-4 w-4" />
              Ver candidatos
            </Button>
          </Link>
        </div>
      ) : myApplication ? (
        <div className="rounded-xl border p-4 bg-muted/50">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            <p className="text-sm font-semibold">Candidatura registrada</p>
          </div>
          <Badge variant={applicationStatusVariant(myApplication.status)}>
            {applicationStatusLabel(myApplication.status)}
          </Badge>
        </div>
      ) : shift.status === 'ABERTO' && currentUser?.type === 'doctor' ? (
        <Button
          size="lg"
          className="w-full"
          disabled={createApplication.isPending}
          onClick={() =>
            createApplication.mutate({ data: { shiftId: shift.id } })
          }
          data-testid="button-candidatar"
        >
          {createApplication.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Tenho interesse
        </Button>
      ) : shift.status === 'ABERTO' && !currentUser ? (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Faça login para se candidatar a este plantão
          </p>
          <Link href="/login">
            <Button className="w-full">Entrar para se candidatar</Button>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
