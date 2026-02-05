import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { 
  MapPin, 
  Users, 
  Star, 
  Home as HomeIcon,
  Search,
  Filter,
  Sparkles
} from "lucide-react";
import { Link } from "wouter";

export default function Properties() {
  const { user } = useAuth();
  const { data: properties, isLoading } = trpc.properties.list.useQuery();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProperties = properties?.filter(property => 
    property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <Link href="/">
                <Button variant="ghost">Home</Button>
              </Link>
              {user && (
                <Link href="/profile">
                  <Button variant="outline">
                    {user.name || 'Profilo'}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="luxury-gradient py-16">
        <div className="container">
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4 text-gradient-gold text-center">
            Ville di Lusso
          </h1>
          <p className="text-xl text-muted-foreground text-center max-w-2xl mx-auto">
            Scopri la nostra selezione esclusiva di ville con piscine private e servizi premium
          </p>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-background border-b">
        <div className="container">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cerca per città, paese o nome villa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Button variant="outline" className="h-12">
              <Filter className="w-5 h-5 mr-2" />
              Filtri
            </Button>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="py-12">
        <div className="container">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
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
          ) : filteredProperties && filteredProperties.length > 0 ? (
            <>
              <div className="mb-6 text-muted-foreground">
                {filteredProperties.length} {filteredProperties.length === 1 ? 'villa trovata' : 'ville trovate'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProperties.map((property) => (
                  <Link key={property.id} href={`/properties/${property.id}`}>
                    <Card className="overflow-hidden hover:shadow-luxury-lg transition-luxury cursor-pointer group h-full">
                      <div className="relative h-64 bg-muted image-overlay">
                        <img
                          src={`https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop&q=80`}
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
                        <h3 className="text-xl font-serif font-semibold mb-2 group-hover:text-primary transition-luxury line-clamp-1">
                          {property.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="line-clamp-1">{property.city}, {property.country}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{property.maxGuests}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <HomeIcon className="w-4 h-4" />
                              <span>{property.bedrooms}</span>
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
            </>
          ) : (
            <div className="text-center py-20">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-2xl font-serif font-semibold mb-2">Nessuna villa trovata</h3>
              <p className="text-muted-foreground mb-6">
                Prova a modificare i criteri di ricerca
              </p>
              <Button onClick={() => setSearchQuery("")} variant="outline">
                Cancella Ricerca
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
