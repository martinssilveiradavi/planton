import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@workspace/planton-ds/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/planton-ds/components/ui/card";
import { Loader2, ShieldCheck, Stethoscope } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

export default function Login() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, login } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) setLocation("/");
  }, [isAuthenticated, isLoading, setLocation]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Stethoscope className="h-7 w-7 text-primary" />
            <span className="text-2xl font-bold text-primary">Planton</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Plantões médicos, sempre disponíveis
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Entrar na sua conta</CardTitle>
            <CardDescription>
              Use sua conta Google para acessar o Planton com segurança.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full gap-3 bg-background"
              onClick={login}
              disabled={isLoading}
              data-testid="button-google-login"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <FcGoogle className="h-5 w-5" />
              )}
              Entrar com o Google
            </Button>
            <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p>
                Seus dados profissionais continuam protegidos e vinculados à sua
                identidade autenticada.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}