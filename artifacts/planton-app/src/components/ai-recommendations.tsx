import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetCurrentUserQueryKey,
  getListApplicationsQueryKey,
  getListShiftsQueryKey,
  useCreateApplication,
  useGetCurrentUser,
  useListApplications,
  useRecommendShifts,
  type ShiftRecommendation,
} from '@workspace/api-client-react';
import { Alert, AlertDescription } from '@workspace/planton-ds/components/ui/alert';
import { Badge } from '@workspace/planton-ds/components/ui/badge';
import { Button } from '@workspace/planton-ds/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@workspace/planton-ds/components/ui/card';
import { Input } from '@workspace/planton-ds/components/ui/input';
import { Label } from '@workspace/planton-ds/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/planton-ds/components/ui/select';
import { toast } from '@workspace/planton-ds/hooks/use-toast';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Hospital,
  LoaderCircle,
  MapPin,
  Sparkles,
  Stethoscope,
  WalletCards,
} from 'lucide-react';
import { formatDate, formatRemuneration } from './shift-card';

const SPECIALTIES = [
  'Anestesiologia',
  'Cardiologia',
  'Cirurgia Geral',
  'Clínica Geral',
  'Clínica Médica',
  'Dermatologia',
  'Ginecologia e Obstetrícia',
  'Medicina de Emergência',
  'Neurologia',
  'Ortopedia',
  'Pediatria',
  'Psiquiatria',
  'Radiologia',
  'UTI Adulto',
  'UTI Neonatal',
];

const LOADING_MESSAGES = [
  'Analisando seu perfil...',
  'Buscando plantões próximos...',
  'Comparando distância, especialidade e oportunidades...',
  'Selecionando o melhor plantão para você...',
];

function formatCep(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.length > 5
    ? `${digits.slice(0, 5)}-${digits.slice(5)}`
    : digits;
}

function calculateDuration(startTime: string, endTime: string) {
  const [startHour = 0, startMinute = 0] = startTime.split(':').map(Number);
  const [endHour = 0, endMinute = 0] = endTime.split(':').map(Number);
  const start = startHour * 60 + startMinute;
  let end = endHour * 60 + endMinute;
  if (end <= start) end += 24 * 60;
  const duration = (end - start) / 60;
  return Number.isInteger(duration)
    ? `${duration} ${duration === 1 ? 'hora' : 'horas'}`
    : `${duration.toLocaleString('pt-BR')} horas`;
}

function formatTime(value: string) {
  return `${value.slice(0, 5).replace(':', 'h')}`;
}

function ResultItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Hospital;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-muted/50 p-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function IdealShiftResult({
  recommendation,
  isAuthenticated,
  isDoctor,
  isApplied,
  isApplying,
  onApply,
}: {
  recommendation: ShiftRecommendation;
  isAuthenticated: boolean;
  isDoctor: boolean;
  isApplied: boolean;
  isApplying: boolean;
  onApply: () => void;
}) {
  const { shift, score, reason, distanceKm } = recommendation;

  return (
    <div className="space-y-3" data-testid="ideal-shift-result">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-base font-bold text-foreground">🎯 Seu plantão ideal</p>
          <p className="text-xs text-muted-foreground">
            A melhor oportunidade entre os plantões disponíveis
          </p>
        </div>
        <Badge className="shrink-0 bg-accent text-accent-foreground">
          Compatibilidade: {score}%
        </Badge>
      </div>

      <Card className="overflow-hidden border-primary/30 shadow-sm">
        <CardHeader className="border-b border-border bg-primary/5 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Hospital className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-base">{shift.hospitalName}</CardTitle>
              <CardDescription>{shift.title}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-2">
            <ResultItem
              icon={Stethoscope}
              label="Especialidade"
              value={shift.specialty}
            />
            <ResultItem
              icon={MapPin}
              label="Distância"
              value={
                distanceKm == null
                  ? `${shift.city}, ${shift.state}`
                  : `${distanceKm.toLocaleString('pt-BR')} km`
              }
            />
            <ResultItem
              icon={CalendarDays}
              label="Data"
              value={formatDate(shift.date)}
            />
            <ResultItem
              icon={Clock3}
              label="Horário"
              value={`${formatTime(shift.startTime)} às ${formatTime(shift.endTime)}`}
            />
            <ResultItem
              icon={Clock3}
              label="Duração"
              value={calculateDuration(shift.startTime, shift.endTime)}
            />
            <ResultItem
              icon={WalletCards}
              label="Valor"
              value={formatRemuneration(shift.remuneration)}
            />
          </div>

          <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
            <p className="mb-1 text-xs font-semibold text-foreground">
              Por que recomendamos este plantão?
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">“{reason}”</p>
          </div>
        </CardContent>

        <CardFooter className="flex gap-2 border-t border-border bg-muted/30 pt-4">
          <Link href={`/shifts/${shift.id}`} className="flex-1">
            <Button variant="outline" className="w-full" data-testid="button-ideal-details">
              Ver detalhes
            </Button>
          </Link>
          {isApplied ? (
            <Button className="flex-1 gap-2" disabled>
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Interesse enviado
            </Button>
          ) : isDoctor ? (
            <Button
              className="flex-1"
              disabled={isApplying}
              onClick={onApply}
              data-testid="button-ideal-apply"
            >
              {isApplying ? 'Enviando...' : 'Tenho interesse'}
            </Button>
          ) : !isAuthenticated ? (
            <Link href="/login" className="flex-1">
              <Button className="w-full" data-testid="button-ideal-login">
                Tenho interesse
              </Button>
            </Link>
          ) : (
            <Button className="flex-1" disabled>
              Tenho interesse
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export function AiRecommendations() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [cep, setCep] = useState('');
  const [formError, setFormError] = useState('');
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [applyingShiftId, setApplyingShiftId] = useState<number | null>(null);

  const { data: currentUser } = useGetCurrentUser({
    query: { queryKey: getGetCurrentUserQueryKey(), retry: false },
  });
  const isDoctor = currentUser?.type === 'doctor';

  useEffect(() => {
    if (!currentUser) return;
    setName((current) => current || currentUser.name);
    if (currentUser.type === 'doctor' && currentUser.specialty) {
      setSpecialty((current) => current || currentUser.specialty || '');
    }
  }, [currentUser]);

  const { data: applications } = useListApplications({
    query: {
      queryKey: getListApplicationsQueryKey(),
      enabled: isDoctor,
      retry: false,
    },
  });

  const appliedShiftIds = useMemo(
    () => new Set((applications ?? []).map((application) => application.shiftId)),
    [applications],
  );

  const recommend = useRecommendShifts();

  useEffect(() => {
    if (!recommend.isPending) {
      setLoadingMessageIndex(0);
      return;
    }
    const interval = window.setInterval(() => {
      setLoadingMessageIndex((current) =>
        Math.min(current + 1, LOADING_MESSAGES.length - 1),
      );
    }, 850);
    return () => window.clearInterval(interval);
  }, [recommend.isPending]);

  const createApplication = useCreateApplication({
    mutation: {
      onSuccess: () => {
        toast({
          title: 'Interesse enviado',
          description: 'A instituição recebeu sua candidatura.',
        });
        queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListShiftsQueryKey() });
        setApplyingShiftId(null);
      },
      onError: (error: unknown) => {
        toast({
          title: 'Não foi possível enviar',
          description:
            error instanceof Error ? error.message : 'Tente novamente em instantes.',
          variant: 'destructive',
        });
        setApplyingShiftId(null);
      },
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedCep = cep.replace(/\D/g, '');
    if (name.trim().length < 2) {
      setFormError('Informe seu nome.');
      return;
    }
    if (!specialty) {
      setFormError('Selecione sua especialidade médica.');
      return;
    }
    if (normalizedCep.length !== 8) {
      setFormError('Informe um CEP válido com 8 números.');
      return;
    }

    setFormError('');
    recommend.mutate({
      data: {
        name: name.trim(),
        specialty,
        cep: normalizedCep,
      },
    });
  };

  const recommendation = recommend.data?.recommendations[0];

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-card to-accent/5 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-lg">Plantão Ideal com IA</CardTitle>
            <CardDescription>
              Preencha três dados e encontre a melhor oportunidade para você.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="ideal-shift-name">Nome</Label>
            <Input
              id="ideal-shift-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Seu nome"
              autoComplete="name"
              disabled={recommend.isPending}
              data-testid="input-ideal-name"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ideal-shift-specialty">Especialidade médica</Label>
            <Select
              value={specialty}
              onValueChange={setSpecialty}
              disabled={recommend.isPending}
            >
              <SelectTrigger
                id="ideal-shift-specialty"
                data-testid="select-ideal-specialty"
              >
                <SelectValue placeholder="Selecione sua especialidade" />
              </SelectTrigger>
              <SelectContent>
                {SPECIALTIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ideal-shift-cep">CEP</Label>
            <Input
              id="ideal-shift-cep"
              value={cep}
              onChange={(event) => setCep(formatCep(event.target.value))}
              placeholder="00000-000"
              inputMode="numeric"
              autoComplete="postal-code"
              disabled={recommend.isPending}
              data-testid="input-ideal-cep"
            />
          </div>

          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full text-base shadow-sm"
            disabled={recommend.isPending}
            data-testid="button-find-ideal-shift"
          >
            {recommend.isPending ? (
              <>
                <LoaderCircle className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                Analisando oportunidades
              </>
            ) : (
              '✨ Encontrar meu plantão ideal'
            )}
          </Button>
        </form>

        {recommend.isPending && (
          <div
            className="rounded-xl border border-primary/20 bg-background/80 p-4 text-center"
            aria-live="polite"
            data-testid="ideal-shift-loading"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 animate-pulse text-primary" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {LOADING_MESSAGES[loadingMessageIndex]}
            </p>
            <div className="mx-auto mt-3 h-1.5 max-w-48 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{
                  width: `${((loadingMessageIndex + 1) / LOADING_MESSAGES.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {recommend.isError && !recommend.isPending && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {recommend.error instanceof Error
                ? recommend.error.message
                : 'Não foi possível encontrar o plantão ideal. Tente novamente.'}
            </AlertDescription>
          </Alert>
        )}

        {recommend.data &&
          !recommend.isPending &&
          (recommendation ? (
            <IdealShiftResult
              recommendation={recommendation}
              isAuthenticated={Boolean(currentUser)}
              isDoctor={isDoctor}
              isApplied={appliedShiftIds.has(recommendation.shiftId)}
              isApplying={applyingShiftId === recommendation.shiftId}
              onApply={() => {
                setApplyingShiftId(recommendation.shiftId);
                createApplication.mutate({
                  data: { shiftId: recommendation.shiftId },
                });
              }}
            />
          ) : (
            <Alert>
              <AlertDescription>
                {recommend.data.message ?? 'Não encontramos plantões disponíveis no momento.'}
              </AlertDescription>
            </Alert>
          ))}
      </CardContent>
    </Card>
  );
}