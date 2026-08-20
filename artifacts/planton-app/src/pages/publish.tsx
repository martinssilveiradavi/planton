import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@workspace/planton-ds/components/ui/button';
import { Input } from '@workspace/planton-ds/components/ui/input';
import { Label } from '@workspace/planton-ds/components/ui/label';
import { Textarea } from '@workspace/planton-ds/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/planton-ds/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/planton-ds/components/ui/select';
import { Separator } from '@workspace/planton-ds/components/ui/separator';
import { toast } from '@workspace/planton-ds/hooks/use-toast';
import {
  useGetCurrentUser,
  useCreateShift,
  getGetCurrentUserQueryKey,
  getListShiftsQueryKey,
  Shift,
} from '@workspace/api-client-react';
import { Loader2, CheckCircle2, ExternalLink } from 'lucide-react';

const SPECIALTIES = [
  'Clínica Geral', 'Cardiologia', 'Pediatria', 'Ortopedia', 'Neurologia',
  'Ginecologia e Obstetrícia', 'Cirurgia Geral', 'Pronto Socorro', 'UTI Adulto',
  'UTI Neonatal', 'Anestesiologia', 'Radiologia', 'Dermatologia', 'Psiquiatria',
  'Endocrinologia', 'Gastroenterologia', 'Infectologia', 'Nefrologia',
];

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR',
  'PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

const schema = z.object({
  title: z.string().min(3, 'Título deve ter ao menos 3 caracteres'),
  specialty: z.string().min(1, 'Especialidade obrigatória'),
  description: z.string().optional(),
  requirements: z.string().optional(),
  date: z.string().min(1, 'Data obrigatória'),
  startTime: z.string().min(1, 'Hora de início obrigatória'),
  endTime: z.string().min(1, 'Hora de término obrigatória'),
  remuneration: z.coerce.number().min(0, 'Valor deve ser positivo'),
  address: z.string().min(1, 'Endereço obrigatório'),
  city: z.string().min(1, 'Cidade obrigatória'),
  state: z.string().min(1, 'Estado obrigatório'),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function Publish() {
  const [, setLocation] = useLocation();
  const [createdShift, setCreatedShift] = useState<Shift | null>(null);
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: userLoading } = useGetCurrentUser({
    query: { queryKey: getGetCurrentUserQueryKey(), retry: false },
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      specialty: '',
      description: '',
      requirements: '',
      date: '',
      startTime: '',
      endTime: '',
      remuneration: 0,
      address: '',
      city: '',
      state: '',
    },
  });

  const createShift = useCreateShift({
    mutation: {
      onSuccess: (shift) => {
        setCreatedShift(shift);
        toast({ title: 'Plantão publicado com sucesso!' });
        queryClient.invalidateQueries({ queryKey: getListShiftsQueryKey() });
      },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Erro ao publicar plantão';
        toast({ title: 'Erro', description: message, variant: 'destructive' });
      },
    },
  });

  const onSubmit = (values: FormValues) => {
    const { latitude, longitude, ...rest } = values;
    createShift.mutate({
      data: {
        ...rest,
        ...(latitude ? { latitude } : {}),
        ...(longitude ? { longitude } : {}),
      },
    });
  };

  if (userLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-primary/10 rounded w-1/2" />
          <div className="h-64 bg-primary/10 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.type !== 'hospital') {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Loader2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Acesso restrito</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Apenas hospitais podem publicar plantões. Faça login com uma conta hospitalar.
        </p>
        <Link href="/login">
          <Button>Fazer login</Button>
        </Link>
      </div>
    );
  }

  if (createdShift) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-accent" />
        </div>
        <h2 className="text-xl font-bold mb-2">Plantão publicado!</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Médicos já podem ver e se candidatar ao plantão{' '}
          <strong>{createdShift.title}</strong>.
        </p>
        <div className="flex gap-3">
          <Link href={`/shifts/${createdShift.id}`} className="flex-1">
            <Button className="w-full gap-2">
              <ExternalLink className="h-4 w-4" />
              Ver plantão
            </Button>
          </Link>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setCreatedShift(null)}
          >
            Publicar outro
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Publicar plantão</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Preencha as informações do plantão para encontrar médicos disponíveis
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Título do plantão</Label>
              <Input
                id="title"
                placeholder="Ex.: Plantão de Pronto-Socorro"
                {...register('title')}
                data-testid="input-title"
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="specialty">Especialidade</Label>
              <Select onValueChange={(v) => setValue('specialty', v)}>
                <SelectTrigger data-testid="select-specialty">
                  <SelectValue placeholder="Selecione a especialidade" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.specialty && (
                <p className="text-xs text-destructive">{errors.specialty.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o plantão, atividades, ambiente de trabalho..."
                rows={3}
                {...register('description')}
                data-testid="input-description"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="requirements">Requisitos</Label>
              <Textarea
                id="requirements"
                placeholder="CRM ativo, experiência mínima, certificações..."
                rows={3}
                {...register('requirements')}
                data-testid="input-requirements"
              />
            </div>
          </CardContent>
        </Card>

        {/* Date & Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data e horário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 space-y-1.5">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  {...register('date')}
                  data-testid="input-date"
                />
                {errors.date && (
                  <p className="text-xs text-destructive">{errors.date.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="startTime">Início</Label>
                <Input
                  id="startTime"
                  type="time"
                  {...register('startTime')}
                  data-testid="input-start-time"
                />
                {errors.startTime && (
                  <p className="text-xs text-destructive">{errors.startTime.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endTime">Término</Label>
                <Input
                  id="endTime"
                  type="time"
                  {...register('endTime')}
                  data-testid="input-end-time"
                />
                {errors.endTime && (
                  <p className="text-xs text-destructive">{errors.endTime.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Remuneration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Remuneração</CardTitle>
            <CardDescription>Valor total a ser pago pelo plantão</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label htmlFor="remuneration">Valor (R$)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                  R$
                </span>
                <Input
                  id="remuneration"
                  type="number"
                  min="0"
                  className="pl-9"
                  placeholder="1200"
                  {...register('remuneration')}
                  data-testid="input-remuneration"
                />
              </div>
              {errors.remuneration && (
                <p className="text-xs text-destructive">{errors.remuneration.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Localização</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="address">Endereço completo</Label>
              <Input
                id="address"
                placeholder="Rua das Flores, 123 — Bairro Centro"
                {...register('address')}
                data-testid="input-address"
              />
              {errors.address && (
                <p className="text-xs text-destructive">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  placeholder="São Paulo"
                  {...register('city')}
                  data-testid="input-city"
                />
                {errors.city && (
                  <p className="text-xs text-destructive">{errors.city.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="state">Estado</Label>
                <Select onValueChange={(v) => setValue('state', v)}>
                  <SelectTrigger data-testid="select-state">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.state && (
                  <p className="text-xs text-destructive">{errors.state.message}</p>
                )}
              </div>
            </div>

            <Separator />
            <p className="text-xs text-muted-foreground">
              Coordenadas (opcional — para exibir no mapa)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="-23.5505"
                  {...register('latitude')}
                  data-testid="input-latitude"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="-46.6333"
                  {...register('longitude')}
                  data-testid="input-longitude"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={createShift.isPending}
          data-testid="button-submit"
        >
          {createShift.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Publicar plantão
        </Button>
      </form>
    </div>
  );
}
