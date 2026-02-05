import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { 
  Search, 
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
      <section className="relative pt-32 pb-20 luxury-gradient overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
        </div>

        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <Badge className="mb-6 px-6 py-2 text-sm font-medium" variant="secondary">
              Ville di Lusso Esclusive
            </Badge>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-serif font-bold mb-6 text-gradient-gold">
              Vivi l'Eccellenza
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Scopri le ville più esclusive al mondo con piscine private, viste mozzafiato 
              e servizi di lusso incomparabili
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="flex gap-4">
              <Link href="/properties">
                <Button size="lg" className="text-lg px-8 py-6">
                  Esplora le Ville
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/properties-map">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  <MapPin className="mr-2 w-5 h-5" />
                  Vista Mappa
                </Button>
              </Link>
            </div>
              {!isAuthenticated && (
                <a href={getLoginUrl()}>
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                    Inizia Ora
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container">
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
                  <Sparkles className="w-8 h-8 text-primary" />
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
              Selezione curata delle nostre proprietà più esclusive
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
          ) : properties && properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.slice(0, 6).map((property) => (
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

          {properties && properties.length > 6 && (
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
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
                <li><Link href="/about" className="hover:text-primary transition-colors">Chi Siamo</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contatti</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Proprietari</h4>
              <ul className="space-y-2 text-sm text-secondary-foreground/80">
                <li><Link href="/become-host" className="hover:text-primary transition-colors">Diventa Host</Link></li>
                <li><Link href="/host/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Supporto</h4>
              <ul className="space-y-2 text-sm text-secondary-foreground/80">
                <li><Link href="/help" className="hover:text-primary transition-colors">Centro Assistenza</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors">Termini</Link></li>
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link></li>
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
