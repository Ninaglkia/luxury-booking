import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { 
  Clock3,
  Compass,
  Crown,
  ChevronRight,
  CalendarCheck2,
  ShieldCheck,
  MapPin, 
  Users, 
  Star, 
  Waves, 
  Mountain, 
  Sparkles,
  ArrowRight,
  Home as HomeIcon
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: properties, isLoading } = trpc.properties.list.useQuery();
  const featuredProperties = properties?.slice(0, 6) ?? [];
  const hasMoreProperties = (properties?.length ?? 0) > 6;

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="glass-effect fixed top-0 left-0 right-0 z-50 border-b">
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
              {isAuthenticated ? (
                <>
                  <Link href="/properties">
                    <Button variant="ghost">Esplora Ville</Button>
                  </Link>
                  {user?.role === 'host' || user?.role === 'admin' ? (
                    <Link href="/host/dashboard">
                      <Button variant="ghost">Dashboard Host</Button>
                    </Link>
                  ) : (
                    <Link href="/become-host">
                      <Button variant="ghost">Diventa Host</Button>
                    </Link>
                  )}
                  {user?.role === 'admin' && (
                    <Link href="/admin">
                      <Button variant="ghost">Admin</Button>
                    </Link>
                  )}
                  <Link href="/profile">
                    <Button variant="outline">
                      {user?.name || 'Profilo'}
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/properties">
                    <Button variant="ghost">Esplora Ville</Button>
                  </Link>
                  <a href={getLoginUrl()}>
                    <Button className="shadow-luxury">Accedi</Button>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 pb-16 md:pt-32 md:pb-20 luxury-gradient overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-16 -left-12 w-72 h-72 bg-primary/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-8 -right-12 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"></div>
        </div>

        <div className="container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-7 animate-fade-in">
              <Badge className="mb-6 px-4 py-2 text-sm font-medium" variant="secondary">
                Ville di lusso verificate
              </Badge>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold leading-tight mb-6 text-gradient-gold">
                Prenota la villa perfetta in pochi minuti
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
                Seleziona destinazione, confronta servizi premium e conferma online.
                Tutto in modo semplice, trasparente e senza passaggi complicati.
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-card border text-sm">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Annunci verificati</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-card border text-sm">
                  <CalendarCheck2 className="w-4 h-4 text-primary" />
                  <span>Prenotazione immediata</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-card border text-sm">
                  <Clock3 className="w-4 h-4 text-primary" />
                  <span>Supporto rapido</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link href="/properties">
                  <Button size="lg" className="text-base sm:text-lg px-7 sm:px-8">
                    Esplora le Ville
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/properties-map">
                  <Button size="lg" variant="outline" className="text-base sm:text-lg px-7 sm:px-8">
                    <MapPin className="w-5 h-5" />
                    Vista Mappa
                  </Button>
                </Link>
                {!isAuthenticated && (
                  <a href={getLoginUrl()}>
                    <Button size="lg" variant="secondary" className="text-base sm:text-lg px-7 sm:px-8">
                      Inizia Ora
                    </Button>
                  </a>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 animate-slide-in-right">
              <Card className="shadow-luxury-lg border-2 border-primary/20 bg-card/95">
                <CardContent className="p-6 md:p-7">
                  <div className="flex items-center gap-2 mb-5">
                    <Compass className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-serif font-semibold">Parti da qui</h2>
                  </div>
                  <div className="space-y-3">
                    <Link href="/properties">
                      <Button variant="outline" className="w-full justify-between h-11">
                        Scopri tutte le ville
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href="/properties-map">
                      <Button variant="outline" className="w-full justify-between h-11">
                        Trova per posizione
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    {isAuthenticated ? (
                      user?.role === "host" || user?.role === "admin" ? (
                        <Link href="/host/dashboard">
                          <Button variant="outline" className="w-full justify-between h-11">
                            Vai alla dashboard host
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      ) : (
                        <Link href="/become-host">
                          <Button variant="outline" className="w-full justify-between h-11">
                            Pubblica la tua villa
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      )
                    ) : (
                      <a href={getLoginUrl()}>
                        <Button className="w-full h-11 shadow-luxury">
                          Accedi e prenota
                        </Button>
                      </a>
                    )}
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-lg font-semibold text-primary">{properties?.length ?? "0"}</p>
                      <p className="text-xs text-muted-foreground">Ville</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-lg font-semibold text-primary">24/7</p>
                      <p className="text-xs text-muted-foreground">Supporto</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-lg font-semibold text-primary">Premium</p>
                      <p className="text-xs text-muted-foreground">Servizi</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-3">Perche scegliere Luxury Booking</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Meno frizioni, piu fiducia e un'esperienza piu veloce dalla ricerca alla prenotazione.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary transition-luxury hover:shadow-luxury">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Waves className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-serif font-semibold mb-4">Piscine Private</h3>
                <p className="text-muted-foreground">
                  Ogni villa dispone di piscine esclusive per il massimo relax e privacy
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-luxury hover:shadow-luxury">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mountain className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-serif font-semibold mb-4">Viste Panoramiche</h3>
                <p className="text-muted-foreground">
                  Panorami mozzafiato su mare, montagne e paesaggi da sogno
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-luxury hover:shadow-luxury">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Crown className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-serif font-semibold mb-4">Servizi Premium</h3>
                <p className="text-muted-foreground">
                  Chef privati, maggiordomi e concierge 24/7 per un'esperienza indimenticabile
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-gradient-gold">
              Ville in Evidenza
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Selezione curata delle nostre proprieta piu esclusive
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="h-64 bg-muted"></div>
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded mb-4"></div>
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProperties.map((property) => (
                <Link key={property.id} href={`/properties/${property.id}`}>
                  <Card className="overflow-hidden hover:shadow-luxury-lg transition-luxury cursor-pointer group">
                    <div className="relative h-64 bg-muted image-overlay">
                      <img
                        src={`https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop`}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-luxury"
                      />
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-primary text-primary-foreground">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Luxury
                        </Badge>
                      </div>
                      <div className="absolute left-4 bottom-4 z-10">
                        <Badge variant="secondary" className="bg-background/80 backdrop-blur">
                          Prenotabile ora
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-serif font-semibold mb-2 group-hover:text-primary transition-luxury">
                        {property.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <MapPin className="w-4 h-4" />
                        <span>{property.city}, {property.country}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{property.maxGuests}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <HomeIcon className="w-4 h-4" />
                            <span>{property.bedrooms} camere</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            €{property.pricePerNight}
                          </div>
                          <div className="text-xs text-muted-foreground">per notte</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-2xl font-serif font-semibold mb-2">Nessuna villa disponibile</h3>
              <p className="text-muted-foreground mb-6">
                Le nostre ville esclusive saranno presto disponibili
              </p>
              {(user?.role === 'host' || user?.role === 'admin') && (
                <Link href="/host/properties/new">
                  <Button>Aggiungi la tua Villa</Button>
                </Link>
              )}
            </div>
          )}

          {hasMoreProperties && (
            <div className="text-center mt-12">
              <Link href="/properties">
                <Button size="lg" variant="outline" className="shadow-luxury">
                  Vedi Tutte le Ville
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-3">Come funziona</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tre passaggi semplici per passare dall'idea al soggiorno.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-2">
              <CardContent className="pt-8">
                <Badge variant="secondary" className="mb-4">1</Badge>
                <h3 className="text-2xl font-serif font-semibold mb-3">Cerca</h3>
                <p className="text-muted-foreground">
                  Esplora ville per destinazione, capienza e fascia di prezzo.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="pt-8">
                <Badge variant="secondary" className="mb-4">2</Badge>
                <h3 className="text-2xl font-serif font-semibold mb-3">Confronta</h3>
                <p className="text-muted-foreground">
                  Valuta servizi, camere e posizione con schede chiare.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="pt-8">
                <Badge variant="secondary" className="mb-4">3</Badge>
                <h3 className="text-2xl font-serif font-semibold mb-3">Prenota</h3>
                <p className="text-muted-foreground">
                  Conferma in pochi click e prepara il tuo soggiorno di lusso.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 luxury-gradient">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
              Possiedi una Villa di Lusso?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Unisciti alla nostra esclusiva community di proprietari e condividi 
              la tua villa con ospiti selezionati da tutto il mondo
            </p>
            {isAuthenticated ? (
              user?.role === 'guest' ? (
                <Link href="/become-host">
                  <Button size="lg" className="shadow-luxury-lg gold-shimmer">
                    Diventa Host
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <Link href="/host/properties/new">
                  <Button size="lg" className="shadow-luxury-lg gold-shimmer">
                    Aggiungi la tua Villa
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              )
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="shadow-luxury-lg gold-shimmer">
                  Inizia Ora
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary text-secondary-foreground py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
                <span className="text-xl font-serif font-bold">Luxury Booking</span>
              </div>
              <p className="text-sm text-secondary-foreground/80">
                La piattaforma esclusiva per ville di lusso con servizi premium
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Esplora</h4>
              <ul className="space-y-2 text-sm text-secondary-foreground/80">
                <li><Link href="/properties" className="hover:text-primary transition-colors">Ville</Link></li>
                <li><Link href="/properties-map" className="hover:text-primary transition-colors">Mappa</Link></li>
                <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Proprietari</h4>
              <ul className="space-y-2 text-sm text-secondary-foreground/80">
                <li><Link href="/become-host" className="hover:text-primary transition-colors">Diventa Host</Link></li>
                <li><Link href="/host/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-secondary-foreground/20 pt-8 text-center text-sm text-secondary-foreground/60">
            <p>&copy; 2026 Luxury Booking. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
