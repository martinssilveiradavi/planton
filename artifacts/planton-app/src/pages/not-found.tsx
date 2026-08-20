import { Link } from 'wouter';
import { Card, CardContent } from '@workspace/planton-ds/components/ui/card';
import { Button } from '@workspace/planton-ds/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Página não encontrada
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            A página que você procura não existe ou foi movida.
          </p>
          <Link href="/">
            <Button>Voltar ao início</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
