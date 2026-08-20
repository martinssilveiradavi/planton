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
import { toast } from '@workspace/planton-ds/hooks/use-toast';
import {
  useLoginUser,
  getGetCurrentUserQueryKey,
} from '@workspace/api-client-react';
import { Stethoscope, Loader2 } from 'lucide-react';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const login = useLoginUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        toast({ title: 'Bem-vindo de volta!' });
        setLocation('/');
      },
      onError: (err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'Erro ao fazer login';
        toast({ title: 'Erro', description: message, variant: 'destructive' });
      },
    },
  });

  const onSubmit = (values: FormValues) => {
    login.mutate({ data: values });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Stethoscope className="h-7 w-7 text-primary" />
            <span className="text-2xl font-bold text-primary">Planton</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Plantões médicos, sempre disponíveis
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>
              Acesse sua conta para ver plantões disponíveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com.br"
                  {...register('email')}
                  data-testid="input-email"
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  data-testid="input-password"
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={login.isPending}
                data-testid="button-submit"
              >
                {login.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Entrar
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Não tem conta?{' '}
              <Link href="/register" className="text-primary font-medium hover:underline">
                Cadastre-se
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
