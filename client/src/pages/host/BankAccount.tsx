import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { 
  Sparkles,
  CreditCard,
  Shield,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trash2,
  ArrowLeft
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function BankAccount() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    iban: "",
    bankName: "",
    accountHolderName: "",
    swift: "",
  });

  const { data: bankAccount, isLoading, refetch } = trpc.bankAccounts.getBankAccount.useQuery();

  const upsertMutation = trpc.bankAccounts.upsertBankAccount.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.bankAccounts.deleteBankAccount.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.iban || !formData.bankName || !formData.accountHolderName) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }

    upsertMutation.mutate(formData);
  };

  const handleEdit = () => {
    if (bankAccount) {
      setFormData({
        iban: bankAccount.iban,
        bankName: bankAccount.bankName,
        accountHolderName: bankAccount.accountHolderName,
        swift: bankAccount.swift || "",
      });
    }
    setIsEditing(true);
  };

  const handleDelete = () => {
    if (confirm("Sei sicuro di voler eliminare i dati bancari?")) {
      deleteMutation.mutate();
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <Sparkles className="w-12 h-12 text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
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
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="p-6 max-w-md">
            <p className="mb-4">Effettua il login per accedere</p>
            <a href={getLoginUrl()}>
              <Button>Accedi</Button>
            </a>
          </Card>
        </div>
      </div>
    );
  }

  if (user.role !== "host" && user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
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
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="p-6 max-w-md text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-amber-500" />
            <h2 className="text-xl font-serif font-bold mb-2">Accesso Negato</h2>
            <p className="text-muted-foreground mb-6">
              Solo i proprietari possono accedere ai dati bancari
            </p>
            <Link href="/">
              <Button>Torna alla Home</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="glass-effect border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <Sparkles className="w-8 h-8 text-primary" />
                <span className="text-2xl font-serif font-bold text-gradient-gold">
                  Luxury Booking
                </span>
              </div>
            </Link>
            <Link href="/host/dashboard">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard Host
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2">Dati Bancari</h1>
          <p className="text-muted-foreground">
            Gestisci i tuoi dati bancari per ricevere pagamenti tramite bonifico
          </p>
        </div>

        {/* Info Alert */}
        <Card className="p-6 mb-6 border-blue-500/50 bg-blue-500/5">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-blue-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-1">Sicurezza e Privacy</h3>
              <p className="text-sm text-muted-foreground">
                I tuoi dati bancari sono protetti e criptati. Verranno utilizzati solo per
                processare i pagamenti delle prenotazioni delle tue proprietà.
              </p>
            </div>
          </div>
        </Card>

        {bankAccount && !isEditing ? (
          /* Display Existing Bank Account */
          <Card className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-semibold">Conto Bancario</h2>
                  {bankAccount.isVerified ? (
                    <Badge variant="default" className="gap-1 mt-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Verificato
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      In verifica
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Modifica
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Elimina
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">IBAN</Label>
                <p className="text-lg font-mono">{(bankAccount as any).ibanMasked}</p>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Nome Banca</Label>
                  <p className="text-lg">{bankAccount.bankName}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Intestatario</Label>
                  <p className="text-lg">{bankAccount.accountHolderName}</p>
                </div>
              </div>
              {bankAccount.swift && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm text-muted-foreground">Codice SWIFT/BIC</Label>
                    <p className="text-lg font-mono">{bankAccount.swift}</p>
                  </div>
                </>
              )}
              <Separator />
              <div className="text-sm text-muted-foreground">
                Ultimo aggiornamento:{" "}
                {new Date(bankAccount.updatedAt).toLocaleDateString("it-IT", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
          </Card>
        ) : (
          /* Add/Edit Form */
          <Card className="p-8">
            <h2 className="text-xl font-serif font-semibold mb-6">
              {bankAccount ? "Modifica Dati Bancari" : "Aggiungi Dati Bancari"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="iban">
                  IBAN <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="iban"
                  type="text"
                  placeholder="IT60 X054 2811 1010 0000 0123 456"
                  value={formData.iban}
                  onChange={(e) =>
                    setFormData({ ...formData, iban: e.target.value.toUpperCase() })
                  }
                  required
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Inserisci l'IBAN completo (15-34 caratteri)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="bankName">
                    Nome Banca <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bankName"
                    type="text"
                    placeholder="Banca Intesa Sanpaolo"
                    value={formData.bankName}
                    onChange={(e) =>
                      setFormData({ ...formData, bankName: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="accountHolderName">
                    Intestatario <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="accountHolderName"
                    type="text"
                    placeholder="Mario Rossi"
                    value={formData.accountHolderName}
                    onChange={(e) =>
                      setFormData({ ...formData, accountHolderName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="swift">Codice SWIFT/BIC (Opzionale)</Label>
                <Input
                  id="swift"
                  type="text"
                  placeholder="BCITITMM"
                  value={formData.swift}
                  onChange={(e) =>
                    setFormData({ ...formData, swift: e.target.value.toUpperCase() })
                  }
                  maxLength={11}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Richiesto per bonifici internazionali
                </p>
              </div>

              <Separator />

              <div className="flex justify-end gap-3">
                {bankAccount && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Annulla
                  </Button>
                )}
                <Button type="submit" disabled={upsertMutation.isPending}>
                  {upsertMutation.isPending
                    ? "Salvataggio..."
                    : bankAccount
                    ? "Aggiorna Dati"
                    : "Salva Dati"}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
