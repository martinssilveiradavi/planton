import { Link } from 'wouter';
import { Badge } from '@workspace/planton-ds/components/ui/badge';
import { Button } from '@workspace/planton-ds/components/ui/button';
import { cn } from '@workspace/planton-ds/lib/utils';
import { Shift } from '@workspace/api-client-react';
import { Calendar, Clock, MapPin, MapPinned } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function formatRemuneration(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return dateStr;
  }
}

function statusVariant(status: Shift['status']) {
  switch (status) {
    case 'ABERTO':
      return 'default'; // will override with accent via className
    case 'PREENCHIDO':
      return 'secondary';
    case 'CANCELADO':
      return 'destructive';
    case 'ENCERRADO':
      return 'outline';
    default:
      return 'outline';
  }
}

function statusLabel(status: Shift['status']) {
  switch (status) {
    case 'ABERTO':
      return 'Aberto';
    case 'PREENCHIDO':
      return 'Preenchido';
    case 'CANCELADO':
      return 'Cancelado';
    case 'ENCERRADO':
      return 'Encerrado';
    default:
      return status;
  }
}

interface ShiftCardProps {
  shift: Shift;
  compact?: boolean;
  isSelected?: boolean;
  onMapFocus?: () => void;
}

export function ShiftCard({
  shift,
  compact = false,
  isSelected = false,
  onMapFocus,
}: ShiftCardProps) {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all duration-200 group',
        isSelected && 'border-primary ring-2 ring-primary/20'
      )}
      data-testid={`card-shift-${shift.id}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground text-sm leading-tight truncate">
            {shift.hospitalName}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{shift.specialty}</p>
        </div>
        <Badge
          className={cn(
            'rounded-full text-xs shrink-0',
            shift.status === 'ABERTO' && 'bg-accent text-accent-foreground border-transparent'
          )}
          variant={statusVariant(shift.status)}
        >
          {statusLabel(shift.status)}
        </Badge>
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>{formatDate(shift.date)}</span>
          <span className="mx-1">·</span>
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>
            {shift.startTime} – {shift.endTime}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {shift.city}, {shift.state}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xl font-bold text-primary">
            {formatRemuneration(shift.remuneration)}
          </p>
          {!compact && shift.applicationsCount !== undefined && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {shift.applicationsCount} candidato{shift.applicationsCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onMapFocus && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="gap-1.5 px-2 text-muted-foreground"
              onClick={onMapFocus}
              aria-label={`Mostrar ${shift.hospitalName} no mapa`}
              data-testid={`button-map-focus-${shift.id}`}
            >
              <MapPinned className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mapa</span>
            </Button>
          )}
          <Link href={`/shifts/${shift.id}`}>
            <Button size="sm" variant="secondary" data-testid={`button-ver-mais-${shift.id}`}>
              Ver mais
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ShiftCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 animate-pulse">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 space-y-1.5">
          <div className="h-4 bg-primary/10 rounded w-3/4" />
          <div className="h-3 bg-primary/10 rounded w-1/2" />
        </div>
        <div className="h-5 w-16 bg-primary/10 rounded-full" />
      </div>
      <div className="space-y-1.5 mb-4">
        <div className="h-3 bg-primary/10 rounded w-2/3" />
        <div className="h-3 bg-primary/10 rounded w-1/2" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 bg-primary/10 rounded" />
        <div className="h-8 w-20 bg-primary/10 rounded-md" />
      </div>
    </div>
  );
}

export { formatRemuneration, formatDate, statusLabel, statusVariant };
