import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: properties, isLoading } = trpc.properties.list.useQuery(undefined, {
    retry: 1,
  });

  const featured = properties?.slice(0, 6) ?? [];

  return (
    <div className="min-h-screen bg-[#f2f6fb]">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur-md">
        <div className="container py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="w-9 h-9 rounded-xl bg-[#003b95] text-white flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-xl md:text-2xl font-serif font-bold text-[#0f172a]">Luxury Booking</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-2">
              <Link href="/properties">
                <Button variant="ghost" className="text-slate-700 hover:text-[#003b95]">
                  Esplora
                </Button>
              </Link>
              <Link href="/properties-map">
                <Button variant="ghost" className="text-slate-700 hover:text-[#003b95]">
                  Mappa
                </Button>
              </Link>
              {isAuthenticated ? (
                <Link href="/profile">
                  <Button variant="outline" className="border-slate-300">
                    {user?.name || "Profilo"}
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button className="bg-[#006ce4] hover:bg-[#0057b8] text-white">Accedi</Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-28 pb-14 bg-gradient-to-b from-[#003b95] via-[#0057b8] to-[#006ce4] text-white">
        <div className="container">
          <div className="max-w-4xl">
            <Badge className="mb-5 bg-white/20 text-white border-white/20 hover:bg-white/20">
              Ville premium verificate
            </Badge>
            <h1 className="text-4xl md:text-6xl font-serif font-bold leading-tight">
              Trova la villa perfetta
              <br />
              per il tuo prossimo viaggio
            </h1>
            <p className="mt-5 text-white/90 text-lg md:text-xl max-w-2xl">
              Esperienza di prenotazione rapida, filtri smart e mappa interattiva in tempo reale.
            </p>
          </div>

          <Card className="mt-10 bg-white text-slate-900 border-0 shadow-2xl rounded-2xl">
            <CardContent className="p-4 md:p-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-4">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dove</label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Città o zona" className="pl-9 h-11 border-slate-300" />
                  </div>
                </div>
                <div className="md:col-span-3">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Check-in</label>
                  <div className="relative mt-1">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Data arrivo" className="pl-9 h-11 border-slate-300" />
                  </div>
                </div>
                <div className="md:col-span-3">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ospiti</label>
                  <div className="relative mt-1">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="2 adulti" className="pl-9 h-11 border-slate-300" />
                  </div>
                </div>
                <div className="md:col-span-2 flex items-end">
                  <Link href="/properties" className="w-full">
                    <Button className="w-full h-11 bg-[#0071c2] hover:bg-[#005999] text-white">
                      Cerca
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-8 bg-white border-b border-slate-200">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-slate-200">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#e6f4ff] text-[#0057b8] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Prenotazione sicura</p>
                  <p className="text-sm text-slate-600">Pagamenti protetti e supporto dedicato</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#e8fff3] text-[#067647] flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Mappa in tempo reale</p>
                  <p className="text-sm text-slate-600">Confronta aree, prezzi e distanze</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#fff7e8] text-[#b54708] flex items-center justify-center">
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Qualità selezionata</p>
                  <p className="text-sm text-slate-600">Solo ville premium con standard elevati</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="container">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900">Ville Consigliate</h2>
              <p className="text-slate-600 mt-2">Stile Booking: risultati chiari, informazioni utili subito.</p>
            </div>
            <Link href="/properties">
              <Button variant="outline" className="hidden md:inline-flex border-slate-300">
                Vedi tutte
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(item => (
                <Card key={item} className="overflow-hidden border-slate-200">
                  <div className="h-48 bg-slate-200 animate-pulse" />
                  <CardContent className="p-4 space-y-3">
                    <div className="h-5 bg-slate-200 rounded animate-pulse" />
                    <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {featured.map(property => (
                <Link key={property.id} href={`/properties/${property.id}`}>
                  <Card className="group overflow-hidden border-slate-200 hover:shadow-xl transition-all cursor-pointer">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&h=800&fit=crop"
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <Badge className="absolute left-3 top-3 bg-[#003b95] text-white border-0">
                        Guest Favorite
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-lg text-slate-900 leading-tight">{property.title}</h3>
                        <div className="flex items-center gap-1 text-sm bg-[#003b95] text-white px-2 py-1 rounded-md">
                          <Star className="w-3 h-3 fill-current" />
                          <span>9.2</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mt-2 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {property.city}, {property.country}
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {property.maxGuests}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <BedDouble className="w-4 h-4" />
                          {property.bedrooms} camere
                        </span>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-200 flex items-end justify-between">
                        <div className="text-xs text-slate-500">A partire da</div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-slate-900">€{property.pricePerNight}</div>
                          <div className="text-xs text-slate-500">a notte</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="border-slate-200">
              <CardContent className="p-10 text-center">
                <h3 className="text-2xl font-serif font-semibold text-slate-900">Nessuna villa pubblicata</h3>
                <p className="text-slate-600 mt-2 mb-6">Appena le proprietà saranno approvate compariranno qui.</p>
                {(user?.role === "host" || user?.role === "admin") && (
                  <Link href="/host/properties/new">
                    <Button className="bg-[#0071c2] hover:bg-[#005999] text-white">Aggiungi una villa</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <section className="pb-16">
        <div className="container">
          <Card className="border-0 bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#334155] text-white overflow-hidden">
            <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h3 className="text-3xl md:text-4xl font-serif font-bold">Hai una villa da affittare?</h3>
                <p className="text-white/80 mt-2 max-w-2xl">
                  Pubblica in pochi step, gestisci disponibilità e ricevi richieste qualificate.
                </p>
              </div>
              {isAuthenticated ? (
                user?.role === "guest" ? (
                  <Link href="/become-host">
                    <Button className="bg-[#0071c2] hover:bg-[#005999] text-white">
                      Diventa Host
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/host/properties/new">
                    <Button className="bg-[#0071c2] hover:bg-[#005999] text-white">
                      Pubblica Ora
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                )
              ) : (
                <a href={getLoginUrl()}>
                  <Button className="bg-[#0071c2] hover:bg-[#005999] text-white">
                    Inizia Subito
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-300 py-10">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-[#60a5fa]" />
                <span className="text-white font-semibold">Luxury Booking</span>
              </div>
              <p className="text-sm text-slate-400">Prenotazioni premium con esperienza semplice e veloce.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Naviga</h4>
              <div className="space-y-2 text-sm">
                <Link href="/properties" className="block hover:text-white">Tutte le ville</Link>
                <Link href="/properties-map" className="block hover:text-white">Mappa ville</Link>
                <Link href="/become-host" className="block hover:text-white">Diventa host</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Area utente</h4>
              <div className="space-y-2 text-sm">
                <Link href="/profile" className="block hover:text-white">Profilo</Link>
                <Link href="/dashboard" className="block hover:text-white">Dashboard</Link>
                <Link href="/messages" className="block hover:text-white">Messaggi</Link>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-5 border-t border-slate-800 text-sm text-slate-500">
            © 2026 Luxury Booking
          </div>
        </div>
      </footer>
    </div>
  );
}
