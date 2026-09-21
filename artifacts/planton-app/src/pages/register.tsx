import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import {
  getGetCurrentUserQueryKey,
  useCompleteProfile,
} from "@workspace/api-client-react";
import { Button } from "@workspace/planton-ds/components/ui/button";
import { Input } from "@workspace/planton-ds/components/ui/input";
import { Label } from "@workspace/planton-ds/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/planton-ds/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/planton-ds/components/ui/select";
import { toast } from "@workspace/planton-ds/hooks/use-toast";
import { cn } from "@workspace/planton-ds/lib/utils";
import { Building2, Loader2, Stethoscope } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

const SPECIALTIES = [
  "Clínica Geral", "Cardiologia", "Pediatria", "Ortopedia", "Neurologia",
  "Ginecologia e Obstetrícia", "Cirurgia Geral", "Pronto Socorro", "UTI Adulto",
  "UTI Neonatal", "Anestesiologia", "Radiologia", "Dermatologia", "Psiquiatria",
  "Endocrinologia", "Gastroenterologia", "Infectologia", "Nefrologia", "Oncologia",
  "Reumatologia", "Urologia",
];
const STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

const doctorSchema = z.object({
  name: z.string().min(2, "Informe seu nome completo"),
  specialty: z.string().min(1, "Especialidade obrigatória"),
  crmNumber: z.string().min(1, "CRM obrigatório"),
  crmState: z.string().length(2, "Selecione a UF do CRM"),
  phone: z.string().min(1, "Telefone obrigatório"),
  city: z.string().min(1, "Cidade obrigatória"),
  state: z.string().length(2, "Selecione o estado"),
});
const hospitalSchema = z.object({
  name: z.string().min(2, "Informe o nome do responsável"),
  hospitalName: z.string().min(2, "Nome da instituição obrigatório"),
  cnpj: z.string().min(1, "CNPJ obrigatório"),
  phone: z.string().min(1, "Telefone obrigatório"),
  address: z.string().min(1, "Endereço obrigatório"),
  city: z.string().min(1, "Cidade obrigatória"),
  state: z.string().length(2, "Selecione o estado"),
});

type DoctorForm = z.infer<typeof doctorSchema>;
type HospitalForm = z.infer<typeof hospitalSchema>;

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

export default function Register() {
  const [userType, setUserType] = useState<"doctor" | "hospital" | null>(null);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading, login } = useAuth();
  const authName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  const doctorForm = useForm<DoctorForm>({
    resolver: zodResolver(doctorSchema),
    defaultValues: { name: "", specialty: "", crmNumber: "", crmState: "", phone: "", city: "", state: "" },
  });
  const hospitalForm = useForm<HospitalForm>({
    resolver: zodResolver(hospitalSchema),
    defaultValues: { name: "", hospitalName: "", cnpj: "", phone: "", address: "", city: "", state: "" },
  });

  useEffect(() => {
    if (!authName) return;
    doctorForm.setValue("name", authName);
    hospitalForm.setValue("name", authName);
  }, [authName, doctorForm, hospitalForm]);

  const completeProfile = useCompleteProfile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        toast({ title: "Perfil concluído com sucesso!" });
        setLocation("/");
      },
      onError: (error: unknown) => {
        toast({
          title: "Não foi possível concluir o perfil",
          description: error instanceof Error ? error.message : "Revise os dados e tente novamente.",
          variant: "destructive",
        });
      },
    },
  });

  if (isLoading) {
    return <div className="flex min-h-[100dvh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle>Primeiro, entre com o Google</CardTitle>
            <CardDescription>Depois você informa somente os dados profissionais do seu perfil.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="lg" className="w-full gap-3" onClick={login}>
              <FcGoogle className="h-5 w-5" /> Entrar com o Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const shell = (content: ReactNode) => (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Stethoscope className="h-7 w-7 text-primary" />
            <span className="text-2xl font-bold text-primary">Planton</span>
          </div>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
        {content}
      </div>
    </div>
  );

  if (!userType) {
    return shell(
      <Card>
        <CardHeader>
          <CardTitle>Concluir cadastro</CardTitle>
          <CardDescription>Como você vai usar o Planton?</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {([
            ["doctor", "Médico", "Encontre plantões", Stethoscope],
            ["hospital", "Hospital", "Publique plantões", Building2],
          ] as const).map(([type, title, subtitle, Icon]) => (
            <button
              key={type}
              onClick={() => setUserType(type)}
              className={cn("flex flex-col items-center gap-3 rounded-xl border-2 border-border p-6 transition-all hover:border-primary hover:bg-secondary")}
              data-testid={`card-type-${type}`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div><p className="font-semibold">{title}</p><p className="mt-1 text-xs text-muted-foreground">{subtitle}</p></div>
            </button>
          ))}
        </CardContent>
      </Card>,
    );
  }

  if (userType === "doctor") {
    return shell(
      <Card>
        <CardHeader>
          <Button variant="ghost" size="sm" className="mb-1 w-fit px-0" onClick={() => setUserType(null)}>Voltar</Button>
          <CardTitle>Perfil médico</CardTitle>
          <CardDescription>Complete seus dados profissionais.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={doctorForm.handleSubmit((values) => completeProfile.mutate({ data: { ...values, type: "doctor" } }))}>
            <div className="space-y-1.5"><Label>Nome completo</Label><Input {...doctorForm.register("name")} /><FieldError message={doctorForm.formState.errors.name?.message} /></div>
            <div className="space-y-1.5"><Label>Especialidade</Label><Select onValueChange={(value) => doctorForm.setValue("specialty", value)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{SPECIALTIES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><FieldError message={doctorForm.formState.errors.specialty?.message} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5"><Label>CRM</Label><Input {...doctorForm.register("crmNumber")} /></div>
              <div className="space-y-1.5"><Label>UF</Label><Select onValueChange={(value) => doctorForm.setValue("crmState", value)}><SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger><SelectContent>{STATES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-1.5"><Label>Telefone</Label><Input {...doctorForm.register("phone")} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5"><Label>Cidade</Label><Input {...doctorForm.register("city")} /></div>
              <div className="space-y-1.5"><Label>Estado</Label><Select onValueChange={(value) => doctorForm.setValue("state", value)}><SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger><SelectContent>{STATES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <Button className="w-full" disabled={completeProfile.isPending}>{completeProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Concluir cadastro</Button>
          </form>
        </CardContent>
      </Card>,
    );
  }

  return shell(
    <Card>
      <CardHeader>
        <Button variant="ghost" size="sm" className="mb-1 w-fit px-0" onClick={() => setUserType(null)}>Voltar</Button>
        <CardTitle>Perfil da instituição</CardTitle>
        <CardDescription>Complete os dados do hospital ou clínica.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={hospitalForm.handleSubmit((values) => completeProfile.mutate({ data: { ...values, type: "hospital" } }))}>
          <div className="space-y-1.5"><Label>Nome do responsável</Label><Input {...hospitalForm.register("name")} /></div>
          <div className="space-y-1.5"><Label>Hospital ou clínica</Label><Input {...hospitalForm.register("hospitalName")} /></div>
          <div className="space-y-1.5"><Label>CNPJ</Label><Input {...hospitalForm.register("cnpj")} /></div>
          <div className="space-y-1.5"><Label>Telefone</Label><Input {...hospitalForm.register("phone")} /></div>
          <div className="space-y-1.5"><Label>Endereço</Label><Input {...hospitalForm.register("address")} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5"><Label>Cidade</Label><Input {...hospitalForm.register("city")} /></div>
            <div className="space-y-1.5"><Label>Estado</Label><Select onValueChange={(value) => hospitalForm.setValue("state", value)}><SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger><SelectContent>{STATES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <Button className="w-full" disabled={completeProfile.isPending}>{completeProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Concluir cadastro</Button>
        </form>
      </CardContent>
    </Card>,
  );
}