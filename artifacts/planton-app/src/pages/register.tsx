import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@workspace/planton-ds/components/ui/button';
import { Input } from '@workspace/planton-ds/components/ui/input';
import { Label } from '@workspace/planton-ds/components/ui/label';
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
import { toast } from '@workspace/planton-ds/hooks/use-toast';
import { cn } from '@workspace/planton-ds/lib/utils';
import {
  useRegisterUser,
  useLoginUser,
  getGetCurrentUserQueryKey,
} from '@workspace/api-client-react';
import { Stethoscope, Building2, Loader2 } from 'lucide-react';

const SPECIALTIES = [
  'Clínica Geral',
  'Cardiologia',
  'Pediatria',
  'Ortopedia',
  'Neurologia',
  'Ginecologia e Obstetrícia',
  'Cirurgia Geral',
  'Pronto Socorro',
  'UTI Adulto',
  'UTI Neonatal',
  'Anestesiologia',
  'Radiologia',
  'Dermatologia',
  'Psiquiatria',
  'Endocrinologia',
  'Gastroenterologia',
  'Infectologia',
  'Nefrologia',
  'Oncologia',
  'Reumatologia',
  'Urologia',
];

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR',
  'PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

const doctorSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
  specialty: z.string().min(1, 'Especialidade obrigatória'),
  crmNumber: z.string().min(1, 'CRM obrigatório'),
  city: z.string().min(1, 'Cidade obrigatória'),
  state: z.string().min(1, 'Estado obrigatório'),
});

const hospitalSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
  hospitalName: z.string().min(2, 'Nome do hospital obrigatório'),
  city: z.string().min(1, 'Cidade obrigatória'),
  state: z.string().min(1, 'Estado obrigatório'),
});

type DoctorForm = z.infer<typeof doctorSchema>;
type HospitalForm = z.infer<typeof hospitalSchema>;

export default function Register() {
  const [userType, setUserType] = useState<'doctor' | 'hospital' | null>(null);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const doctorForm = useForm<DoctorForm>({
    resolver: zodResolver(doctorSchema),
    defaultValues: { name: '', email: '', password: '', specialty: '', crmNumber: '', city: '', state: '' },
  });

  const hospitalForm = useForm<HospitalForm>({
    resolver: zodResolver(hospitalSchema),
    defaultValues: { name: '', email: '', password: '', hospitalName: '', city: '', state: '' },
  });

  const loginMutation = useLoginUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        setLocation('/');
      },
    },
  });

  const registerMutation = useRegisterUser({
    mutation: {
      onSuccess: (_user, variables) => {
        toast({ title: 'Conta criada com sucesso!' });
        loginMutation.mutate({
          data: { email: variables.data.email, password: variables.data.password },
        });
      },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Erro ao criar conta';
        toast({ title: 'Erro', description: message, variant: 'destructive' });
      },
    },
  });

  const isPending = registerMutation.isPending || loginMutation.isPending;

  const onDoctorSubmit = (values: DoctorForm) => {
    registerMutation.mutate({ data: { ...values, type: 'doctor' } });
  };

  const onHospitalSubmit = (values: HospitalForm) => {
    registerMutation.mutate({ data: { ...values, type: 'hospital' } });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Stethoscope className="h-7 w-7 text-primary" />
            <span className="text-2xl font-bold text-primary">Planton</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Plantões médicos, sempre disponíveis
          </p>
        </div>

        {!userType ? (
          <Card>
            <CardHeader>
              <CardTitle>Criar conta</CardTitle>
              <CardDescription>Escolha o tipo de conta que deseja criar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setUserType('doctor')}
                  className={cn(
                    'flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all',
                    'hover:border-primary hover:bg-secondary',
                    'border-border'
                  )}
                  data-testid="card-type-doctor"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Stethoscope className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">Medico</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Encontre plantoes disponíveis
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setUserType('hospital')}
                  className={cn(
                    'flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all',
                    'hover:border-primary hover:bg-secondary',
                    'border-border'
                  )}
                  data-testid="card-type-hospital"
                >
                  <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-accent" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">Hospital</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Publique plantoes e encontre médicos
                    </p>
                  </div>
                </button>
              </div>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Já tem conta?{' '}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Entrar
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : userType === 'doctor' ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => setUserType(null)}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  Voltar
                </button>
              </div>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                Cadastro de Medico
              </CardTitle>
              <CardDescription>Preencha seus dados para criar a conta</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={doctorForm.handleSubmit(onDoctorSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input
                      id="name"
                      placeholder="Dr. João Silva"
                      {...doctorForm.register('name')}
                      data-testid="input-name"
                    />
                    {doctorForm.formState.errors.name && (
                      <p className="text-xs text-destructive">{doctorForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com.br"
                      {...doctorForm.register('email')}
                      data-testid="input-email"
                    />
                    {doctorForm.formState.errors.email && (
                      <p className="text-xs text-destructive">{doctorForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      {...doctorForm.register('password')}
                      data-testid="input-password"
                    />
                    {doctorForm.formState.errors.password && (
                      <p className="text-xs text-destructive">{doctorForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="specialty">Especialidade</Label>
                    <Select
                      onValueChange={(v) => doctorForm.setValue('specialty', v)}
                    >
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
                    {doctorForm.formState.errors.specialty && (
                      <p className="text-xs text-destructive">{doctorForm.formState.errors.specialty.message}</p>
                    )}
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="crmNumber">CRM</Label>
                    <Input
                      id="crmNumber"
                      placeholder="CRM/SP 123456"
                      {...doctorForm.register('crmNumber')}
                      data-testid="input-crm"
                    />
                    {doctorForm.formState.errors.crmNumber && (
                      <p className="text-xs text-destructive">{doctorForm.formState.errors.crmNumber.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      placeholder="São Paulo"
                      {...doctorForm.register('city')}
                      data-testid="input-city"
                    />
                    {doctorForm.formState.errors.city && (
                      <p className="text-xs text-destructive">{doctorForm.formState.errors.city.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="state">Estado</Label>
                    <Select onValueChange={(v) => doctorForm.setValue('state', v)}>
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
                    {doctorForm.formState.errors.state && (
                      <p className="text-xs text-destructive">{doctorForm.formState.errors.state.message}</p>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit">
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Criar conta
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => setUserType(null)}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  Voltar
                </button>
              </div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-accent" />
                Cadastro de Hospital
              </CardTitle>
              <CardDescription>Preencha os dados do hospital</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={hospitalForm.handleSubmit(onHospitalSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="h-name">Nome do responsável</Label>
                    <Input
                      id="h-name"
                      placeholder="Nome completo"
                      {...hospitalForm.register('name')}
                      data-testid="input-name"
                    />
                    {hospitalForm.formState.errors.name && (
                      <p className="text-xs text-destructive">{hospitalForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="h-hospitalName">Nome do hospital</Label>
                    <Input
                      id="h-hospitalName"
                      placeholder="Hospital São Lucas"
                      {...hospitalForm.register('hospitalName')}
                      data-testid="input-hospital-name"
                    />
                    {hospitalForm.formState.errors.hospitalName && (
                      <p className="text-xs text-destructive">{hospitalForm.formState.errors.hospitalName.message}</p>
                    )}
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="h-email">E-mail</Label>
                    <Input
                      id="h-email"
                      type="email"
                      placeholder="contato@hospital.com.br"
                      {...hospitalForm.register('email')}
                      data-testid="input-email"
                    />
                    {hospitalForm.formState.errors.email && (
                      <p className="text-xs text-destructive">{hospitalForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="h-password">Senha</Label>
                    <Input
                      id="h-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      {...hospitalForm.register('password')}
                      data-testid="input-password"
                    />
                    {hospitalForm.formState.errors.password && (
                      <p className="text-xs text-destructive">{hospitalForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="h-city">Cidade</Label>
                    <Input
                      id="h-city"
                      placeholder="São Paulo"
                      {...hospitalForm.register('city')}
                      data-testid="input-city"
                    />
                    {hospitalForm.formState.errors.city && (
                      <p className="text-xs text-destructive">{hospitalForm.formState.errors.city.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="h-state">Estado</Label>
                    <Select onValueChange={(v) => hospitalForm.setValue('state', v)}>
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
                    {hospitalForm.formState.errors.state && (
                      <p className="text-xs text-destructive">{hospitalForm.formState.errors.state.message}</p>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit">
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Criar conta
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
