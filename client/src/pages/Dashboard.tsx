import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { 
  Sparkles,
  User,
  Calendar,
  Star,
  Heart,
  CreditCard,
  FileText,
  Bell,
  Settings,
  Shield,
  LogOut,
  Home
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

type Section = "overview" | "bookings" | "reviews" | "wishlist" | "profile" | "payments" | "documents" | "notifications";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<Section>("overview");

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <p className="mb-4">Effettua il login per accedere alla dashboard</p>
          <a href={getLoginUrl()}>
            <Button>Accedi</Button>
          </a>
        </Card>
      </div>
    );
  }

  const menuItems = [
    { id: "overview" as Section, label: "Panoramica", icon: Home },
    { id: "bookings" as Section, label: "Le mie prenotazioni", icon: Calendar },
    { id: "reviews" as Section, label: "Le mie recensioni", icon: Star },
    { id: "wishlist" as Section, label: "Preferiti", icon: Heart },
    { id: "profile" as Section, label: "Profilo", icon: User },
    { id: "payments" as Section, label: "Pagamenti", icon: CreditCard },
    { id: "documents" as Section, label: "Documenti", icon: FileText },
    { id: "notifications" as Section, label: "Notifiche", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-64 border-r bg-background flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Sparkles className="w-8 h-8 text-primary" />
              <span className="text-xl font-serif font-bold text-gradient-gold">
                Luxury Booking
              </span>
            </div>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{user.name || "Utente"}</h3>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            {user.isVerified ? (
              <Badge variant="default" className="gap-1">
                <Shield className="w-3 h-3" />
                Verificato
              </Badge>
            ) : (
              <Link href="/verification">
                <Badge variant="secondary" className="gap-1 cursor-pointer hover:bg-secondary/80">
                  <Shield className="w-3 h-3" />
                  Non verificato
                </Badge>
              </Link>
            )}
            <Badge variant="outline">{user.role}</Badge>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="w-5 h-5" />
            Esci
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          {activeSection === "overview" && <OverviewSection user={user} />}
          {activeSection === "bookings" && <BookingsSection />}
          {activeSection === "reviews" && <ReviewsSection />}
          {activeSection === "wishlist" && <WishlistSection />}
          {activeSection === "profile" && <ProfileSection user={user} />}
          {activeSection === "payments" && <PaymentsSection />}
          {activeSection === "documents" && <DocumentsSection user={user} />}
          {activeSection === "notifications" && <NotificationsSection />}
        </div>
      </div>
    </div>
  );
}

function OverviewSection({ user }: { user: any }) {
  return (
    <div>
      <h1 className="text-4xl font-serif font-bold mb-2">
        Benvenuto, {user.name || "Utente"}!
      </h1>
      <p className="text-muted-foreground mb-8">
        Gestisci le tue prenotazioni, recensioni e preferenze da qui
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Prenotazioni attive</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Star className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recensioni</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <Heart className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Preferiti</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </Card>
      </div>

      {!user.isVerified && (
        <Card className="p-6 border-amber-500/50 bg-amber-500/5">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-amber-500 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Verifica il tuo account</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Aumenta la sicurezza del tuo account verificando il tuo numero di telefono
              </p>
              <Link href="/verification">
                <Button variant="default">Verifica ora</Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function BookingsSection() {
  return (
    <div>
      <h2 className="text-3xl font-serif font-bold mb-6">Le mie prenotazioni</h2>
      <Card className="p-12 text-center">
        <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-serif font-semibold mb-2">
          Nessuna prenotazione
        </h3>
        <p className="text-muted-foreground mb-6">
          Non hai ancora effettuato prenotazioni. Esplora le nostre ville di lusso!
        </p>
        <Link href="/properties">
          <Button>Esplora ville</Button>
        </Link>
      </Card>
    </div>
  );
}

function ReviewsSection() {
  return (
    <div>
      <h2 className="text-3xl font-serif font-bold mb-6">Le mie recensioni</h2>
      <Card className="p-12 text-center">
        <Star className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-serif font-semibold mb-2">
          Nessuna recensione
        </h3>
        <p className="text-muted-foreground">
          Dopo il tuo soggiorno potrai lasciare una recensione
        </p>
      </Card>
    </div>
  );
}

function WishlistSection() {
  const { data: wishlist, isLoading } = trpc.wishlist.getWishlist.useQuery();

  if (isLoading) {
    return <div>Caricamento...</div>;
  }

  return (
    <div>
      <h2 className="text-3xl font-serif font-bold mb-6">I miei preferiti</h2>
      {wishlist && wishlist.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => {
            if (!item.property) return null;
            return (
              <Card key={item.id} className="overflow-hidden">
                {(item.property as any).firstImage && (
                  <img
                    src={(item.property as any).firstImage}
                    alt={item.property.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold mb-2">{item.property.title}</h3>
                  <p className="text-2xl font-bold text-primary">
                    €{item.property.pricePerNight}/notte
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-serif font-semibold mb-2">
            Nessun preferito
          </h3>
          <p className="text-muted-foreground mb-6">
            Salva le tue ville preferite per trovarle facilmente
          </p>
          <Link href="/properties">
            <Button>Esplora ville</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

function ProfileSection({ user }: { user: any }) {
  return (
    <div>
      <h2 className="text-3xl font-serif font-bold mb-6">Profilo</h2>
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nome</label>
            <p className="text-lg">{user.name || "Non impostato"}</p>
          </div>
          <Separator />
          <div>
            <label className="text-sm font-medium">Email</label>
            <p className="text-lg">{user.email || "Non impostato"}</p>
          </div>
          <Separator />
          <div>
            <label className="text-sm font-medium">Telefono</label>
            <p className="text-lg">{user.phone || "Non impostato"}</p>
          </div>
          <Separator />
          <div>
            <label className="text-sm font-medium">Ruolo</label>
            <p className="text-lg capitalize">{user.role}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function PaymentsSection() {
  return (
    <div>
      <h2 className="text-3xl font-serif font-bold mb-6">Metodi di pagamento</h2>
      <Card className="p-12 text-center">
        <CreditCard className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-serif font-semibold mb-2">
          Nessun metodo di pagamento
        </h3>
        <p className="text-muted-foreground">
          Aggiungi una carta di credito per prenotazioni più veloci
        </p>
      </Card>
    </div>
  );
}

function DocumentsSection({ user }: { user: any }) {
  return (
    <div>
      <h2 className="text-3xl font-serif font-bold mb-6">Documenti di identità</h2>
      {user.idDocumentUrl ? (
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <FileText className="w-12 h-12 text-primary" />
            <div className="flex-1">
              <h3 className="font-semibold">Documento caricato</h3>
              <p className="text-sm text-muted-foreground">
                Tipo: {user.idDocumentType}
              </p>
              <p className="text-sm text-muted-foreground">
                Numero: {user.idDocumentNumber}
              </p>
              {user.idDocumentVerified ? (
                <Badge variant="default" className="mt-2">Verificato</Badge>
              ) : (
                <Badge variant="secondary" className="mt-2">In verifica</Badge>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-serif font-semibold mb-2">
            Nessun documento caricato
          </h3>
          <p className="text-muted-foreground mb-6">
            Carica un documento di identità per verificare il tuo account
          </p>
          <Button>Carica documento</Button>
        </Card>
      )}
    </div>
  );
}

function NotificationsSection() {
  return (
    <div>
      <h2 className="text-3xl font-serif font-bold mb-6">Notifiche e preferenze</h2>
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Email promozionali</h3>
              <p className="text-sm text-muted-foreground">
                Ricevi offerte esclusive e novità
              </p>
            </div>
            <Button variant="outline">Attiva</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Notifiche prenotazioni</h3>
              <p className="text-sm text-muted-foreground">
                Aggiornamenti sulle tue prenotazioni
              </p>
            </div>
            <Button variant="outline">Attiva</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Messaggi</h3>
              <p className="text-sm text-muted-foreground">
                Notifiche per nuovi messaggi
              </p>
            </div>
            <Button variant="outline">Attiva</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
