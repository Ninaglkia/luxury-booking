import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { 
  Check,
  X,
  Eye,
  MapPin,
  Users,
  Sparkles,
  Home as HomeIcon,
  ArrowLeft
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const { data: pendingProperties, isLoading } = trpc.admin.pendingProperties.useQuery();
  const utils = trpc.useUtils();

  const reviewMutation = trpc.admin.reviewProperty.useMutation({
    onSuccess: () => {
      toast.success("Proprietà aggiornata con successo");
      utils.admin.pendingProperties.invalidate();
      setShowRejectDialog(false);
      setSelectedProperty(null);
      setRejectionReason("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleApprove = (propertyId: number) => {
    reviewMutation.mutate({
      propertyId,
      action: 'approve',
    });
  };

  const handleReject = () => {
    if (!selectedProperty) return;
    
    if (!rejectionReason.trim()) {
      toast.error("Inserisci un motivo per il rifiuto");
      return;
    }

    reviewMutation.mutate({
      propertyId: selectedProperty,
      action: 'reject',
      rejectionReason,
    });
  };

  const openRejectDialog = (propertyId: number) => {
    setSelectedProperty(propertyId);
    setShowRejectDialog(true);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="mb-4">Accesso negato. Solo gli amministratori possono accedere.</p>
            <Link href="/">
              <Button>Torna alla Home</Button>
            </Link>
          </CardContent>
        </Card>
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
              <Link href="/">
                <Button variant="ghost">Home</Button>
              </Link>
              <Link href="/properties">
                <Button variant="ghost">Ville</Button>
              </Link>
              <Link href="/host/dashboard">
                <Button variant="ghost">Dashboard Host</Button>
              </Link>
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
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2 text-gradient-gold">
            Dashboard Amministratore
          </h1>
          <p className="text-lg text-muted-foreground">
            Gestisci le richieste di approvazione ville
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ville in Attesa
              </CardTitle>
              <HomeIcon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {pendingProperties?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approvate Oggi
              </CardTitle>
              <Check className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rifiutate Oggi
              </CardTitle>
              <X className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Properties */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-serif">Ville in Attesa di Approvazione</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-32 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : pendingProperties && pendingProperties.length > 0 ? (
              <div className="space-y-6">
                {pendingProperties.map((property) => (
                  <div
                    key={property.id}
                    className="border rounded-lg p-6 hover:border-primary transition-luxury"
                  >
                    <div className="flex gap-6">
                      <div className="w-48 h-32 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        <img
                          src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop"
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h3 className="text-2xl font-serif font-semibold mb-2">
                              {property.title}
                            </h3>
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                              <MapPin className="w-4 h-4" />
                              <span>{property.city}, {property.country}</span>
                            </div>
                          </div>
                          <Badge variant="secondary">In Attesa</Badge>
                        </div>

                        <p className="text-muted-foreground mb-4 line-clamp-2">
                          {property.description}
                        </p>

                        <div className="flex items-center gap-6 text-sm mb-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            <span>{property.maxGuests} ospiti</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <HomeIcon className="w-4 h-4 text-primary" />
                            <span>{property.bedrooms} camere</span>
                          </div>
                          <div className="text-lg font-bold text-primary">
                            €{property.pricePerNight} / notte
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Link href={`/properties/${property.id}`}>
                            <Button variant="outline">
                              <Eye className="w-4 h-4 mr-2" />
                              Visualizza Dettagli
                            </Button>
                          </Link>
                          <Button
                            onClick={() => handleApprove(property.id)}
                            disabled={reviewMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Approva
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => openRejectDialog(property.id)}
                            disabled={reviewMutation.isPending}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Rifiuta
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Check className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-serif font-semibold mb-2">
                  Nessuna villa in attesa
                </h3>
                <p className="text-muted-foreground">
                  Tutte le ville sono state revisionate
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rifiuta Villa</DialogTitle>
            <DialogDescription>
              Inserisci il motivo del rifiuto. Il proprietario riceverà una notifica.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejectionReason">Motivo del Rifiuto</Label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Es: Le foto non sono di qualità sufficiente..."
              rows={4}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
              }}
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={reviewMutation.isPending || !rejectionReason.trim()}
            >
              Conferma Rifiuto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
