import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Shield, CheckCircle2, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Verification() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [debugCode, setDebugCode] = useState<string | null>(null);

  const requestCodeMutation = trpc.verification.requestCode.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setStep("code");
      if (data.debugCode) {
        setDebugCode(data.debugCode);
        toast.info(`Codice di test: ${data.debugCode}`, { duration: 10000 });
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const verifyCodeMutation = trpc.verification.verifyCode.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1500);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleRequestCode = () => {
    if (!phone || phone.length < 10) {
      toast.error("Inserisci un numero di telefono valido");
      return;
    }
    requestCodeMutation.mutate({ phone });
  };

  const handleVerifyCode = () => {
    if (code.length !== 6) {
      toast.error("Il codice deve essere di 6 cifre");
      return;
    }
    verifyCodeMutation.mutate({ code });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <p className="mb-4">Effettua il login per verificare il tuo account</p>
          <Link href="/">
            <Button>Torna alla Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (user.isVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h2 className="text-2xl font-serif font-bold mb-2">Account Verificato</h2>
          <p className="text-muted-foreground mb-6">
            Il tuo account è già stato verificato con successo!
          </p>
          <Link href="/dashboard">
            <Button>Vai alla Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="glass-effect border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Sparkles className="w-8 h-8 text-primary" />
              <span className="text-2xl font-serif font-bold text-gradient-gold">
                Luxury Booking
              </span>
            </div>
          </Link>
        </div>
      </nav>

      {/* Verification Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Shield className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl font-serif font-bold mb-2">
              Autenticazione a due fattori
            </h1>
            <p className="text-muted-foreground">
              {step === "phone"
                ? "Inserisci il tuo numero di telefono per ricevere il codice di verifica"
                : "Inserisci il codice di verifica che abbiamo inviato al tuo numero"}
            </p>
          </div>

          {step === "phone" ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Numero di telefono</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+39 123 456 7890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={requestCodeMutation.isPending}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Inserisci il numero con prefisso internazionale
                </p>
              </div>

              <Button
                className="w-full"
                onClick={handleRequestCode}
                disabled={requestCodeMutation.isPending}
              >
                {requestCodeMutation.isPending ? "Invio in corso..." : "Invia codice"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="code">Codice di verifica</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  disabled={verifyCodeMutation.isPending}
                  className="text-center text-2xl tracking-widest"
                />
                {debugCode && (
                  <p className="text-xs text-amber-600 mt-1">
                    Modalità sviluppo: codice di test {debugCode}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Aspetta 22 secondi prima di richiedere un nuovo codice
                </p>
              </div>

              <Button
                className="w-full"
                onClick={handleVerifyCode}
                disabled={verifyCodeMutation.isPending}
              >
                {verifyCodeMutation.isPending ? "Verifica in corso..." : "Verifica subito"}
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("phone");
                  setCode("");
                }}
              >
                Cambia numero di telefono
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
