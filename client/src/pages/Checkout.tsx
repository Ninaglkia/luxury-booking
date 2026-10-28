import { useState, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { parseISO, format, differenceInCalendarDays } from "date-fns";
import { it } from "date-fns/locale";
import {
  ArrowLeft,
  Star,
  MapPin,
  Users,
  BedDouble,
  Bath,
  Shield,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { getLoginUrl } from "@/const";

function parseParams(search: string) {
  const p = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return {
    propertyId: parseInt(p.get("propertyId") || "0"),
    checkin: p.get("checkin") || "",
    checkout: p.get("checkout") || "",
    adults: parseInt(p.get("adults") || "2"),
    children: parseInt(p.get("children") || "0"),
    pets: parseInt(p.get("pets") || "0"),
  };
}

export default function Checkout() {
  useLocation();
  const { user, isAuthenticated } = useAuth();

  const params = useMemo(() => parseParams(window.location.search), [window.location.search]);
  const { propertyId, checkin, checkout, adults, children, pets } = params;

  const checkinDate = checkin ? parseISO(checkin) : null;
  const checkoutDate = checkout ? parseISO(checkout) : null;
  const nights = checkinDate && checkoutDate ? differenceInCalendarDays(checkoutDate, checkinDate) : 0;
  const totalGuests = adults + children;

  const [guestName, setGuestName] = useState(user?.name || "");
  const [guestEmail, setGuestEmail] = useState(user?.email || "");
  const [guestPhone, setGuestPhone] = useState(user?.phone || "");
  const [specialRequests, setSpecialRequests] = useState("");
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const { data: property, isLoading: propertyLoading } = trpc.properties.getById.useQuery(
    { id: propertyId },
    { enabled: propertyId > 0 }
  );

  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: () => {
      setConfirmed(true);
    },
    onError: (err) => {
      toast.error(err.message || "Errore durante la prenotazione. Riprova.");
    },
  });

  const pricePerNight = property?.pricePerNight || 0;
  const subtotal = pricePerNight * nights;
  const cleaningFee = Math.round(pricePerNight * 0.15);
  const serviceFee = Math.round(subtotal * 0.12);
  const total = subtotal + cleaningFee + serviceFee;

  const handleConfirm = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (!checkinDate || !checkoutDate) {
      toast.error("Date non valide");
      return;
    }
    if (nights < (property?.minimumStay || 1)) {
      toast.error(`Soggiorno minimo: ${property?.minimumStay} notti`);
      return;
    }
    if (!guestName || !guestEmail) {
      toast.error("Inserisci nome e email");
      return;
    }
    createBooking.mutate({
      propertyId,
      checkInDate: checkinDate as Date,
      checkOutDate: checkoutDate as Date,
      numberOfGuests: totalGuests,
      guestName,
      guestEmail,
      guestPhone: guestPhone || undefined,
      specialRequests: specialRequests || undefined,
    });
  };

  if (confirmed) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Prenotazione confermata!</h1>
          <p className="text-slate-600 mb-2">
            Hai prenotato <strong>{property?.title}</strong> a {property?.city}.
          </p>
          <p className="text-slate-500 text-sm mb-8">
            Riceverai una email di conferma a <strong>{guestEmail}</strong>.<br />
            L'host ti contatterà per i dettagli del check-in.
          </p>
          <div className="bg-slate-50 rounded-2xl p-5 text-left mb-6 space-y-3">
            {checkinDate && checkoutDate && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Date</span>
                <span className="font-medium text-slate-900">
                  {format(checkinDate, "d MMM", { locale: it })} – {format(checkoutDate, "d MMM yyyy", { locale: it })}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Ospiti</span>
              <span className="font-medium text-slate-900">{totalGuests} ospiti{pets > 0 ? ` · ${pets} animali` : ""}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-slate-900">Totale pagato</span>
              <span className="text-slate-900">€{total}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl">
                Le mie prenotazioni
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full rounded-xl border-slate-300">
                Torna alla home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <button onClick={() => window.history.back()} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-rose-500">LuxuryStay</span>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Conferma e paga</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* ── LEFT: FORM ── */}
          <div className="lg:col-span-3 space-y-8">
            {/* Trip Summary */}
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Il tuo viaggio</h2>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Date</p>
                    {checkinDate && checkoutDate ? (
                      <p className="text-slate-600 text-sm mt-0.5">
                        {format(checkinDate, "d MMMM", { locale: it })} – {format(checkoutDate, "d MMMM yyyy", { locale: it })}
                        {" "}· {nights} nott{nights !== 1 ? "i" : "e"}
                      </p>
                    ) : (
                      <p className="text-slate-500 text-sm mt-0.5">Date non selezionate</p>
                    )}
                  </div>
                  <button
                    onClick={() => window.history.back()}
                    className="text-sm font-semibold underline text-slate-900 hover:text-rose-600"
                  >
                    Modifica
                  </button>
                </div>
                <Separator />
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Ospiti</p>
                    <p className="text-slate-600 text-sm mt-0.5">
                      {adults} adult{adults !== 1 ? "i" : "o"}
                      {children > 0 && `, ${children} bambin${children !== 1 ? "i" : "o"}`}
                      {pets > 0 && `, ${pets} animal${pets !== 1 ? "i" : "e"}`}
                    </p>
                  </div>
                  <button
                    onClick={() => window.history.back()}
                    className="text-sm font-semibold underline text-slate-900 hover:text-rose-600"
                  >
                    Modifica
                  </button>
                </div>
              </div>
            </section>

            <Separator />

            {/* Guest Info */}
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Informazioni ospite</h2>
              <p className="text-sm text-slate-500 mb-4">Condividi questi dati solo con l'host, mai con terze parti.</p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-slate-700 font-medium">Nome completo</Label>
                  <Input
                    id="name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Mario Rossi"
                    className="mt-1.5 rounded-xl border-slate-300 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="mario@esempio.it"
                    className="mt-1.5 rounded-xl border-slate-300 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-slate-700 font-medium">
                    Telefono <span className="text-slate-400 font-normal">(opzionale)</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+39 333 123 4567"
                    className="mt-1.5 rounded-xl border-slate-300 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="requests" className="text-slate-700 font-medium">
                    Richieste speciali <span className="text-slate-400 font-normal">(opzionale)</span>
                  </Label>
                  <textarea
                    id="requests"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Es. arrivo tardivo, camera per bambini, allergie..."
                    rows={3}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </section>

            <Separator />

            {/* Payment */}
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Pagamento</h2>
              <div className="border border-slate-300 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Carta di credito / debito</span>
                  <div className="flex gap-1">
                    {["💳", "Visa", "MC"].map((c) => (
                      <span key={c} className="text-xs bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-600">{c}</span>
                    ))}
                  </div>
                </div>
                <Input placeholder="Numero carta" className="rounded-xl border-slate-200 h-11" disabled />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="MM/AA" className="rounded-xl border-slate-200 h-11" disabled />
                  <Input placeholder="CVV" className="rounded-xl border-slate-200 h-11" disabled />
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  Pagamenti sicuri con crittografia SSL. Il tuo conto verrà addebitato dopo la conferma dell'host.
                </p>
              </div>
            </section>

            <Separator />

            {/* Policies */}
            <section className="text-sm text-slate-600 space-y-3">
              <h2 className="text-base font-semibold text-slate-900">Regole della casa</h2>
              <p>
                Check-in: <strong>{property?.checkInTime || "15:00"}</strong> · Check-out: <strong>{property?.checkOutTime || "11:00"}</strong>
              </p>
              <p>
                Soggiorno minimo: <strong>{property?.minimumStay || 1} notti</strong> · Max ospiti: <strong>{property?.maxGuests}</strong>
              </p>
              <p className="text-xs text-slate-500">
                Cliccando "Conferma prenotazione" accetti le politiche di cancellazione e le regole della struttura.
                Il pagamento completo verrà addebitato al momento della conferma dell'host.
              </p>
            </section>

            {/* CTA */}
            {isAuthenticated ? (
              <Button
                onClick={handleConfirm}
                disabled={createBooking.isPending || !checkinDate || !checkoutDate || nights <= 0}
                className="w-full h-14 bg-rose-500 hover:bg-rose-600 text-white text-base font-semibold rounded-2xl disabled:opacity-50"
              >
                {createBooking.isPending ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />Conferma in corso...</span>
                ) : (
                  `Conferma prenotazione · €${total}`
                )}
              </Button>
            ) : (
              <a href={getLoginUrl()} className="block">
                <Button className="w-full h-14 bg-rose-500 hover:bg-rose-600 text-white text-base font-semibold rounded-2xl">
                  Accedi per prenotare
                </Button>
              </a>
            )}
          </div>

          {/* ── RIGHT: PROPERTY CARD ── */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              {propertyLoading ? (
                <div className="border border-slate-200 rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-48 bg-slate-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-slate-200 rounded w-3/4" />
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
              ) : property ? (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={
                        (property as any).images?.[0]?.imageUrl ||
                        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop"
                      }
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    {(property as any).averageRating && (
                      <Badge className="absolute top-3 left-3 bg-white/95 text-slate-900 border-0 shadow text-xs font-semibold">
                        Guest Favorite
                      </Badge>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{property.title}</p>
                        <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {property.city}, {property.country}
                        </p>
                      </div>
                      {(property as any).averageRating && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Star className="w-3.5 h-3.5 fill-slate-900 text-slate-900" />
                          <span className="text-sm font-semibold">{Number((property as any).averageRating).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{property.maxGuests} ospiti</span>
                      <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{property.bedrooms} camere</span>
                      <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{property.bathrooms} bagni</span>
                    </div>

                    <Separator className="my-4" />

                    {/* Price breakdown */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <button
                          onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
                          className="flex items-center gap-1 text-slate-700 underline font-medium hover:text-rose-600"
                        >
                          €{pricePerNight} × {nights} notti
                          {showPriceBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        <span className="font-medium text-slate-900">€{subtotal}</span>
                      </div>

                      {showPriceBreakdown && (
                        <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-sm">
                          {Array.from({ length: nights }).map((_, i) => {
                            const d = checkinDate ? new Date(checkinDate.getTime() + i * 86400000) : null;
                            return d ? (
                              <div key={i} className="flex justify-between text-slate-600">
                                <span>{format(d, "d MMM", { locale: it })}</span>
                                <span>€{pricePerNight}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-700 underline cursor-help">Pulizie</span>
                        <span className="font-medium text-slate-900">€{cleaningFee}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-700 underline cursor-help">Commissione servizio</span>
                        <span className="font-medium text-slate-900">€{serviceFee}</span>
                      </div>

                      <Separator className="my-2" />

                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">Totale (EUR)</span>
                        <span className="font-bold text-slate-900 text-lg">€{total}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl p-8 text-center">
                  <p className="text-slate-500">Villa non trovata</p>
                  <Link href="/search">
                    <Button variant="outline" className="mt-4 rounded-xl">Torna alla ricerca</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
