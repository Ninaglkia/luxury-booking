import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { 
  Plus,
  Home as HomeIcon,
  MapPin,
  Eye,
  Edit,
  Sparkles,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard
} from "lucide-react";
import { Link } from "wouter";

export default function HostDashboard() {
  const { user } = useAuth();
  const { data: properties, isLoading } = trpc.properties.myProperties.useQuery();
  const { data: bookings } = trpc.bookings.hostBookings.useQuery();

  const pendingProperties = properties?.filter(p => p.status === 'pending').length || 0;
  const approvedProperties = properties?.filter(p => p.status === 'approved').length || 0;
  const totalBookings = bookings?.length || 0;
  const totalRevenue = bookings?.reduce((sum, b) => sum + b.totalPrice, 0) || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approvata</Badge>;
      case 'pending':
        return <Badge variant="secondary">In Attesa</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rifiutata</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
              <Link href="/properties">
                <Button variant="ghost">Ville</Button>
              </Link>
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
            </div>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-serif font-bold mb-2 text-gradient-gold">
              Dashboard Host
            </h1>
            <p className="text-lg text-muted-foreground">
              Benvenuto, {user?.name}
            </p>
          </div>
          <Link href="/host/properties/new">
            <Button size="lg" className="shadow-luxury gold-shimmer">
              <Plus className="w-5 h-5 mr-2" />
              Aggiungi Villa
            </Button>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/host/properties/new">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Aggiungi Villa</h3>
                  <p className="text-sm text-muted-foreground">Pubblica nuova proprietà</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/host/bank-account">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Dati Bancari</h3>
                  <p className="text-sm text-muted-foreground">Gestisci pagamenti</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/messages">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Messaggi</h3>
                  <p className="text-sm text-muted-foreground">Chat con ospiti</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ville Approvate
              </CardTitle>
              <HomeIcon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{approvedProperties}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                In Attesa
              </CardTitle>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingProperties}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Prenotazioni
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalBookings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Entrate Totali
              </CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">€{totalRevenue.toFixed(0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Properties List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-serif">Le Tue Ville</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-24 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : properties && properties.length > 0 ? (
              <div className="space-y-4">
                {properties.map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:border-primary transition-luxury"
                  >
                    <div className="w-24 h-24 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      <img
                        src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=200&h=200&fit=crop"
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-lg font-serif font-semibold truncate">
                          {property.title}
                        </h3>
                        {getStatusBadge(property.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{property.city}, {property.country}</span>
                      </div>
                      <div className="text-lg font-bold text-primary">
                        €{property.pricePerNight} / notte
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/properties/${property.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizza
                        </Button>
                      </Link>
                      <Link href={`/host/properties/${property.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Modifica
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <HomeIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-serif font-semibold mb-2">
                  Nessuna villa ancora
                </h3>
                <p className="text-muted-foreground mb-6">
                  Inizia aggiungendo la tua prima villa di lusso
                </p>
                <Link href="/host/properties/new">
                  <Button className="shadow-luxury">
                    <Plus className="w-5 h-5 mr-2" />
                    Aggiungi Villa
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
