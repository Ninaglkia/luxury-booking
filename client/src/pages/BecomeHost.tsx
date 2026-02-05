import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  Home as HomeIcon,
  Users,
  TrendingUp,
  Shield,
  Sparkles,
  Check,
  ArrowRight
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function BecomeHost() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  
  const becomeHostMutation = trpc.auth.becomeHost.useMutation({
    onSuccess: () => {
      toast.success("Congratulazioni! Ora sei un proprietario");
      utils.auth.me.invalidate();
      setLocation("/host/properties/new");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleBecomeHost = () => {
    becomeHostMutation.mutate();
  };

  if (user?.role === 'host' || user?.role === 'admin') {
    setLocation("/host/properties/new");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="glass-effect border-b">
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

            <Link href="/">
              <Button variant="ghost">Home</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="luxury-gradient py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 text-gradient-gold">
              Diventa Host su Luxury Booking
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Condividi la tua villa di lusso con ospiti selezionati da tutto il mondo 
              e genera entrate extra con la massima sicurezza
            </p>
            <Button 
              size="lg" 
              className="shadow-luxury-lg gold-shimmer"
              onClick={handleBecomeHost}
              disabled={becomeHostMutation.isPending}
            >
              {becomeHostMutation.isPending ? "Attivazione..." : "Diventa Host Ora"}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-4xl font-serif font-bold text-center mb-12 text-gradient-gold">
            Perché Diventare Host
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-2 hover:border-primary transition-luxury">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-serif font-semibold mb-3">Guadagni Extra</h3>
                <p className="text-muted-foreground">
                  Monetizza la tua villa quando non la utilizzi e genera entrate passive
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-luxury">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-serif font-semibold mb-3">Protezione Totale</h3>
                <p className="text-muted-foreground">
                  Assicurazione completa e verifica accurata degli ospiti
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-luxury">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-serif font-semibold mb-3">Ospiti Selezionati</h3>
                <p className="text-muted-foreground">
                  Solo ospiti verificati e di alto profilo per la tua tranquillità
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-luxury">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <HomeIcon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-serif font-semibold mb-3">Controllo Totale</h3>
                <p className="text-muted-foreground">
                  Gestisci disponibilità, prezzi e regole della casa in autonomia
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <h2 className="text-4xl font-serif font-bold text-center mb-12 text-gradient-gold">
            Come Funziona
          </h2>
          
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-2xl font-serif font-semibold mb-2">Registrati come Host</h3>
                <p className="text-lg text-muted-foreground">
                  Clicca sul pulsante "Diventa Host" e attiva il tuo account proprietario in pochi secondi
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-2xl font-serif font-semibold mb-2">Aggiungi la Tua Villa</h3>
                <p className="text-lg text-muted-foreground">
                  Carica foto professionali, descrivi i servizi e imposta il prezzo per notte
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-2xl font-serif font-semibold mb-2">Approvazione Rapida</h3>
                <p className="text-lg text-muted-foreground">
                  Il nostro team verifica la tua villa entro 24-48 ore per garantire standard di lusso
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="text-2xl font-serif font-semibold mb-2">Inizia a Ricevere Prenotazioni</h3>
                <p className="text-lg text-muted-foreground">
                  Una volta approvata, la tua villa sarà visibile a migliaia di ospiti premium
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 luxury-gradient">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
              Pronto a Iniziare?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Unisciti alla nostra community esclusiva di proprietari di ville di lusso
            </p>
            <Button 
              size="lg" 
              className="shadow-luxury-lg gold-shimmer"
              onClick={handleBecomeHost}
              disabled={becomeHostMutation.isPending}
            >
              {becomeHostMutation.isPending ? "Attivazione..." : "Diventa Host Ora"}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
