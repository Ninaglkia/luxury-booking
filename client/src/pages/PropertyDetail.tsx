import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import type { DateRange } from "react-day-picker";
import {
  MapPin,
  Users,
  Star,
  Home as HomeIcon,
  Bed,
  Bath,
  Maximize,
  Calendar,
  MessageCircle,
  ArrowLeft,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const propertyId = parseInt(id || "0");

  const [showBooking, setShowBooking] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(1);
  const [guestName, setGuestName] = useState(user?.name || "");
  const [guestEmail, setGuestEmail] = useState(user?.email || "");
  const [guestPhone, setGuestPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const { data: property, isLoading } = trpc.properties.getById.useQuery({
    id: propertyId,
  });
  const { data: reviews } = trpc.reviews.getByProperty.useQuery({ propertyId });

  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: () => {
      toast.success(
        "Prenotazione confermata! Riceverai una email di conferma."
      );
      setShowBooking(false);
      setDateRange(undefined);
      navigate("/dashboard");
    },
    onError: err => {
      toast.error(err.message || "Errore durante la prenotazione. Riprova.");
    },
  });

  const nights =
    dateRange?.from && dateRange?.to
      ? Math.ceil(
          (dateRange.to.getTime() - dateRange.from.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;
  const totalPrice = nights * (property?.pricePerNight || 0);

  const handleConfirmBooking = () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Seleziona le date di check-in e check-out.");
      return;
    }
    if (nights < (property?.minimumStay || 1)) {
      toast.error(`Soggiorno minimo: ${property?.minimumStay} notti.`);
      return;
    }
    if (!guestName || !guestEmail) {
      toast.error("Inserisci nome e email.");
      return;
    }
    createBooking.mutate({
      propertyId,
      checkInDate: dateRange.from,
      checkOutDate: dateRange.to,
      numberOfGuests: guests,
      guestName,
      guestEmail,
      guestPhone: guestPhone || undefined,
      specialRequests: specialRequests || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Caricamento villa...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-serif font-semibold mb-4">
            Villa non trovata
          </h2>
          <Link href="/properties">
            <Button>Torna alle Ville</Button>
          </Link>
        </div>
      </div>
    );
  }

  const avgRating = property.rating || 0;
  const totalReviews = reviews?.length || 0;

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
                <Button variant="ghost">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Tutte le Ville
                </Button>
              </Link>
              {user && (
                <Link href="/profile">
                  <Button variant="outline">{user.name || "Profilo"}</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Gallery */}
      <section className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl overflow-hidden">
          <div className="relative h-[400px] md:h-[600px]">
            <img
              src={
                property.images?.[0]?.imageUrl ||
                `https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&h=800&fit=crop&q=80`
              }
              alt={property.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="relative h-[190px] md:h-[290px]">
                <img
                  src={
                    property.images?.[i]?.imageUrl ||
                    `https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&h=400&fit=crop&q=80`
                  }
                  alt={`${property.title} - ${i}`}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      <Dialog open={showBooking} onOpenChange={setShowBooking}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onOpenAutoFocus={e => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif">
              Prenota — {property?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Calendar */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Seleziona le date
              </Label>
              <div className="flex justify-center border rounded-xl p-2">
                <CalendarComponent
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  disabled={{ before: new Date() }}
                  locale={undefined}
                />
              </div>
              {dateRange?.from && dateRange?.to && (
                <div className="flex justify-between mt-3 text-sm text-muted-foreground bg-muted/40 rounded-lg px-4 py-2">
                  <span>
                    Check-in:{" "}
                    <strong>
                      {dateRange.from.toLocaleDateString("it-IT")}
                    </strong>
                  </span>
                  <span>
                    Check-out:{" "}
                    <strong>{dateRange.to.toLocaleDateString("it-IT")}</strong>
                  </span>
                  <span>
                    <strong>{nights}</strong> {nights === 1 ? "notte" : "notti"}
                  </span>
                </div>
              )}
            </div>

            <Separator />

            {/* Guests + details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guests">Numero ospiti</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setGuests(g => Math.max(1, g - 1))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-semibold">
                    {guests}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setGuests(g => Math.min(property?.maxGuests || 99, g + 1))
                    }
                  >
                    <Users className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    / {property?.maxGuests} max
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guestName">Nome completo *</Label>
                <Input
                  id="guestName"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  placeholder="Mario Rossi"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="guestEmail">Email *</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={guestEmail}
                  onChange={e => setGuestEmail(e.target.value)}
                  placeholder="mario@email.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="guestPhone">Telefono</Label>
                <Input
                  id="guestPhone"
                  value={guestPhone}
                  onChange={e => setGuestPhone(e.target.value)}
                  placeholder="+39 333 1234567"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="specialRequests">Richieste speciali</Label>
                <Input
                  id="specialRequests"
                  value={specialRequests}
                  onChange={e => setSpecialRequests(e.target.value)}
                  placeholder="Arrivo tardivo, ecc."
                  className="mt-1"
                />
              </div>
            </div>

            <Separator />

            {/* Price summary */}
            {nights > 0 && (
              <div className="space-y-2 bg-muted/30 rounded-xl px-4 py-3">
                <div className="flex justify-between text-sm">
                  <span>
                    €{property?.pricePerNight} × {nights}{" "}
                    {nights === 1 ? "notte" : "notti"}
                  </span>
                  <span>€{totalPrice}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Totale</span>
                  <span className="text-primary">€{totalPrice}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Non ti verrà addebitato nulla ora
                </p>
              </div>
            )}

            <Button
              className="w-full shadow-luxury gold-shimmer"
              size="lg"
              onClick={handleConfirmBooking}
              disabled={
                createBooking.isPending || !dateRange?.from || !dateRange?.to
              }
            >
              {createBooking.isPending
                ? "Prenotazione in corso..."
                : "Conferma Prenotazione"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Content */}
      <section className="container pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title and Location */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl md:text-5xl font-serif font-bold mb-2 text-gradient-gold">
                    {property.title}
                  </h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-5 h-5" />
                    <span className="text-lg">
                      {property.city}, {property.country}
                    </span>
                  </div>
                </div>
                {totalReviews > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary fill-current" />
                    <span className="text-xl font-semibold">
                      {avgRating.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">
                      ({totalReviews} recensioni)
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span>{property.maxGuests} ospiti</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bed className="w-5 h-5 text-primary" />
                  <span>{property.bedrooms} camere</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="w-5 h-5 text-primary" />
                  <span>{property.bathrooms} bagni</span>
                </div>
                {property.squareMeters && (
                  <div className="flex items-center gap-2">
                    <Maximize className="w-5 h-5 text-primary" />
                    <span>{property.squareMeters} m²</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h2 className="text-2xl font-serif font-semibold mb-4">
                Descrizione
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            <Separator />

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <>
                <div>
                  <h2 className="text-2xl font-serif font-semibold mb-6">
                    Servizi e Comfort
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {property.amenities.map(amenity => (
                      <div key={amenity.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Check className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-lg">{amenity.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Reviews */}
            {reviews && reviews.length > 0 && (
              <div>
                <h2 className="text-2xl font-serif font-semibold mb-6">
                  Recensioni
                </h2>
                <div className="space-y-6">
                  {reviews.slice(0, 3).map(review => (
                    <Card key={review.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? "text-primary fill-current"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString(
                              "it-IT"
                            )}
                          </span>
                        </div>
                        <p className="text-muted-foreground">
                          {review.comment}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-luxury-lg">
              <CardHeader>
                <CardTitle className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-primary">
                    €{property.pricePerNight}
                  </span>
                  <span className="text-lg text-muted-foreground">
                    per notte
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Check-in</span>
                    <span className="font-medium">{property.checkInTime}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Check-out</span>
                    <span className="font-medium">{property.checkOutTime}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Soggiorno minimo
                    </span>
                    <span className="font-medium">
                      {property.minimumStay}{" "}
                      {property.minimumStay === 1 ? "notte" : "notti"}
                    </span>
                  </div>
                </div>

                <Separator />

                {isAuthenticated ? (
                  <>
                    <Button
                      className="w-full shadow-luxury gold-shimmer"
                      size="lg"
                      onClick={() => setShowBooking(true)}
                    >
                      <Calendar className="w-5 h-5 mr-2" />
                      Prenota Ora
                    </Button>
                    <Button variant="outline" className="w-full" size="lg">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Contatta Host
                    </Button>
                  </>
                ) : (
                  <>
                    <a href={getLoginUrl()} className="block">
                      <Button
                        className="w-full shadow-luxury gold-shimmer"
                        size="lg"
                      >
                        Accedi per Prenotare
                      </Button>
                    </a>
                    <p className="text-sm text-center text-muted-foreground">
                      Effettua l'accesso per prenotare questa villa
                    </p>
                  </>
                )}

                <div className="pt-4 text-center text-sm text-muted-foreground">
                  <p>Non ti verrà addebitato nulla in questa fase</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
