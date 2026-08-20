import { useState, lazy, Suspense } from 'react';
import { Button } from '@workspace/planton-ds/components/ui/button';
import { Input } from '@workspace/planton-ds/components/ui/input';
import { Label } from '@workspace/planton-ds/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/planton-ds/components/ui/select';
import { Badge } from '@workspace/planton-ds/components/ui/badge';
import { Separator } from '@workspace/planton-ds/components/ui/separator';
import { cn } from '@workspace/planton-ds/lib/utils';
import {
  useListShifts,
  useGetShiftStats,
  getListShiftsQueryKey,
  getGetShiftStatsQueryKey,
  ListShiftsParams,
} from '@workspace/api-client-react';
import { ShiftCard, ShiftCardSkeleton } from '../components/shift-card';
import { List, Map, SlidersHorizontal, X, TrendingUp } from 'lucide-react';

const ShiftMap = lazy(() =>
  import('../components/shift-map').then((m) => ({ default: m.ShiftMap }))
);

const SPECIALTIES = [
  'Clínica Geral', 'Cardiologia', 'Pediatria', 'Ortopedia', 'Neurologia',
  'Ginecologia e Obstetrícia', 'Cirurgia Geral', 'Pronto Socorro', 'UTI Adulto',
  'UTI Neonatal', 'Anestesiologia', 'Radiologia', 'Dermatologia', 'Psiquiatria',
];

type MobileTab = 'list' | 'map';

export default function Discovery() {
  const [mobileTab, setMobileTab] = useState<MobileTab>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ListShiftsParams>({ status: 'ABERTO' });
  const [draftFilters, setDraftFilters] = useState<ListShiftsParams>({ status: 'ABERTO' });

  const { data: shiftsData, isLoading } = useListShifts(filters, {
    query: { queryKey: getListShiftsQueryKey(filters) },
  });

  const { data: stats } = useGetShiftStats({
    query: { queryKey: getGetShiftStatsQueryKey() },
  });

  const shifts = shiftsData?.shifts ?? [];

  const applyFilters = () => {
    setFilters({ ...draftFilters, status: 'ABERTO' });
    setShowFilters(false);
  };

  const clearFilters = () => {
    const clean = { status: 'ABERTO' as const };
    setDraftFilters(clean);
    setFilters(clean);
    setShowFilters(false);
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => k !== 'status' && v !== undefined && v !== ''
  ).length;

  return (
    <div className="flex flex-col min-h-[calc(100dvh-56px)]">
      {/* Stats bar */}
      {stats && (
        <div className="border-b bg-secondary/50 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-4 overflow-x-auto">
            <div className="flex items-center gap-1.5 shrink-0">
              <TrendingUp className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-medium text-foreground">
                {stats.totalOpen} plantões abertos
              </span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-xs text-muted-foreground shrink-0">
              {stats.totalToday} hoje
            </span>
            {stats.bySpecialty.slice(0, 3).map((s) => (
              <Badge key={s.specialty} variant="outline" className="text-xs shrink-0">
                {s.specialty}: {s.count}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Mobile tab toggle */}
      <div className="md:hidden flex border-b bg-background">
        <button
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors',
            mobileTab === 'list'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground'
          )}
          onClick={() => setMobileTab('list')}
          data-testid="tab-list"
        >
          <List className="h-4 w-4" />
          Lista
        </button>
        <button
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors',
            mobileTab === 'map'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground'
          )}
          onClick={() => setMobileTab('map')}
          data-testid="tab-map"
        >
          <Map className="h-4 w-4" />
          Mapa
        </button>
      </div>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Left panel — list */}
        <div
          className={cn(
            'flex flex-col w-full md:w-[35%] md:border-r border-border',
            mobileTab === 'map' ? 'hidden md:flex' : 'flex'
          )}
        >
          {/* Filter bar */}
          <div className="sticky top-14 z-10 bg-background border-b border-border px-3 py-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-1.5"
                data-testid="button-filters"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filtros
                {activeFilterCount > 0 && (
                  <Badge className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-xs rounded-full bg-primary text-primary-foreground border-transparent">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-1 text-muted-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                  Limpar
                </Button>
              )}
              <span className="ml-auto text-xs text-muted-foreground">
                {shiftsData?.total ?? 0} plantões
              </span>
            </div>

            {/* Filter panel */}
            {showFilters && (
              <div className="mt-3 space-y-3 pb-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Especialidade</Label>
                    <Select
                      value={draftFilters.specialty || ''}
                      onValueChange={(v) =>
                        setDraftFilters((f) => ({ ...f, specialty: v || undefined }))
                      }
                    >
                      <SelectTrigger className="h-8 text-xs" data-testid="filter-specialty">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas</SelectItem>
                        {SPECIALTIES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Cidade</Label>
                    <Input
                      className="h-8 text-xs"
                      placeholder="São Paulo"
                      value={draftFilters.city || ''}
                      onChange={(e) =>
                        setDraftFilters((f) => ({ ...f, city: e.target.value || undefined }))
                      }
                      data-testid="filter-city"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Data</Label>
                    <Input
                      className="h-8 text-xs"
                      type="date"
                      value={draftFilters.date || ''}
                      onChange={(e) =>
                        setDraftFilters((f) => ({ ...f, date: e.target.value || undefined }))
                      }
                      data-testid="filter-date"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Valor mínimo (R$)</Label>
                    <Input
                      className="h-8 text-xs"
                      type="number"
                      placeholder="0"
                      value={draftFilters.minValue ?? ''}
                      onChange={(e) =>
                        setDraftFilters((f) => ({
                          ...f,
                          minValue: e.target.value ? Number(e.target.value) : undefined,
                        }))
                      }
                      data-testid="filter-min-value"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={applyFilters} data-testid="button-apply-filters">
                    Aplicar
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearFilters}>
                    Limpar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Shift list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <ShiftCardSkeleton key={i} />)
            ) : shifts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <List className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground mb-2">
                  Nenhum plantão encontrado
                </p>
                <p className="text-sm text-muted-foreground">
                  Tente ajustar os filtros ou verificar em outra cidade
                </p>
                {activeFilterCount > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                    onClick={clearFilters}
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            ) : (
              shifts.map((shift) => <ShiftCard key={shift.id} shift={shift} />)
            )}
          </div>
        </div>

        {/* Right panel — map */}
        <div
          className={cn(
            'flex-1 p-3',
            mobileTab === 'list' ? 'hidden md:block' : 'block'
          )}
          style={{ height: 'calc(100dvh - 120px)' }}
        >
          <Suspense
            fallback={
              <div className="h-full rounded-xl bg-muted animate-pulse flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Carregando mapa...</p>
              </div>
            }
          >
            <ShiftMap shifts={shifts} className="h-full rounded-xl overflow-hidden" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
