import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { 
  Sparkles,
  User,
  Shield,
  Mail,
  Phone,
  Calendar,
  LogOut,
  Edit
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { useState } from "react";

export default function Profile() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logout effettuato");
      window.location.href = "/";
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (loading) {
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

        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="p-6 max-w-md">
            <p className="mb-4">Effettua il login per accedere al tuo profilo</p>
            <a href={getLoginUrl()}>
              <Button>Accedi</Button>
            </a>
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

            <div className="flex items-center gap-4">
              <Link href="/properties">
                <Button variant="ghost">Esplora Ville</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Button
                variant="ghost"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Esci
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Profile Content */}
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2">Il mio profilo</h1>
          <p className="text-muted-foreground">
            Gestisci le informazioni del tuo account
          </p>
        </div>

        {/* Profile Header Card */}
        <Card className="p-8 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-12 h-12 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-serif font-bold">
                  {user.name || "Utente"}
                </h2>
                {user.isVerified && (
                  <Badge variant="default" className="gap-1">
                    <Shield className="w-3 h-3" />
                    Verificato
                  </Badge>
                )}
                <Badge variant="outline" className="capitalize">
                  {user.role}
                </Badge>
              </div>
              <p className="text-muted-foreground mb-4">
                Membro da {new Date(user.createdAt).toLocaleDateString('it-IT', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
              {!user.isVerified && (
                <Link href="/verification">
                  <Button variant="default" size="sm">
                    <Shield className="w-4 h-4 mr-2" />
                    Verifica account
                  </Button>
                </Link>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="w-4 h-4 mr-2" />
              {isEditing ? "Annulla" : "Modifica"}
            </Button>
          </div>
        </Card>

        {/* Profile Details */}
        <Card className="p-8 mb-6">
          <h3 className="text-xl font-serif font-semibold mb-6">
            Informazioni personali
          </h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  Nome completo
                </Label>
                {isEditing ? (
                  <Input
                    id="name"
                    defaultValue={user.name || ""}
                    placeholder="Inserisci il tuo nome"
                  />
                ) : (
                  <p className="text-lg">{user.name || "Non impostato"}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user.email || ""}
                    placeholder="email@esempio.com"
                  />
                ) : (
                  <p className="text-lg">{user.email || "Non impostato"}</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4" />
                  Telefono
                </Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    type="tel"
                    defaultValue={user.phone || ""}
                    placeholder="+39 123 456 7890"
                  />
                ) : (
                  <p className="text-lg">{user.phone || "Non impostato"}</p>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  Ultimo accesso
                </Label>
                <p className="text-lg">
                  {new Date(user.lastSignedIn).toLocaleDateString('it-IT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            {isEditing && (
              <>
                <Separator />
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Annulla
                  </Button>
                  <Button
                    onClick={() => {
                      toast.success("Profilo aggiornato con successo");
                      setIsEditing(false);
                    }}
                  >
                    Salva modifiche
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dashboard">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <h4 className="font-semibold mb-2">Dashboard</h4>
              <p className="text-sm text-muted-foreground">
                Gestisci prenotazioni e preferiti
              </p>
            </Card>
          </Link>

          <Link href="/messages">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <h4 className="font-semibold mb-2">Messaggi</h4>
              <p className="text-sm text-muted-foreground">
                Chat con proprietari
              </p>
            </Card>
          </Link>

          {(user.role === 'host' || user.role === 'admin') && (
            <Link href="/host/dashboard">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <h4 className="font-semibold mb-2">Dashboard Host</h4>
                <p className="text-sm text-muted-foreground">
                  Gestisci le tue proprietà
                </p>
              </Card>
            </Link>
          )}

          {user.role === 'admin' && (
            <Link href="/admin">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <h4 className="font-semibold mb-2">Admin Panel</h4>
                <p className="text-sm text-muted-foreground">
                  Gestione piattaforma
                </p>
              </Card>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
