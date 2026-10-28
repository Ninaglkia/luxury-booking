import { Bath, BedDouble, Check, MapPin, Maximize, Users } from "lucide-react";
import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { villaPrice, type VillaListing } from "@/data/villa-examples";

export default function VillaExampleDialog({
  villa,
  onClose,
}: {
  villa: VillaListing | null;
  onClose: () => void;
}) {
  const previousFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (villa)
      previousFocus.current = document.activeElement as HTMLElement | null;
  }, [villa]);
  return (
    <Dialog
      open={!!villa}
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      {villa && (
        <DialogContent
          className="stay-example-dialog"
          onCloseAutoFocus={event => {
            event.preventDefault();
            if (previousFocus.current?.isConnected)
              previousFocus.current.focus({ preventScroll: true });
          }}
        >
          <div className="stay-example-photo">
            <img
              src={villa.image}
              alt={`Immagine illustrativa di ${villa.title}`}
            />
            <span className="stay-demo-badge">Annuncio dimostrativo</span>
          </div>
          <div className="stay-example-body">
            <p className="stay-eyebrow">
              <MapPin size={12} />
              {villa.city} · {villa.region}
            </p>
            <DialogTitle>{villa.title}</DialogTitle>
            <DialogDescription>
              Un’idea del tuo prossimo soggiorno.
            </DialogDescription>
            <div className="stay-example-facts">
              <span>
                <Users size={17} />
                {villa.maxGuests} ospiti
              </span>
              <span>
                <BedDouble size={17} />
                {villa.bedrooms} camere
              </span>
              <span>
                <Bath size={17} />
                {villa.bathrooms} bagni
              </span>
              {villa.area && (
                <span>
                  <Maximize size={17} />
                  {villa.area} m²
                </span>
              )}
            </div>
            <p className="stay-example-description">{villa.description}</p>
            <div className="stay-example-amenities">
              {villa.tags.map(tag => (
                <span key={tag}>
                  <Check size={13} />
                  {tag}
                </span>
              ))}
            </div>
            <div className="stay-example-booking">
              <div>
                <strong>{villaPrice(villa.pricePerNight)}</strong>
                <span> / notte · prezzo d’esempio</span>
              </div>
              <button type="button" disabled>
                Prenotazione non disponibile
              </button>
            </div>
            <p className="stay-demo-disclaimer">
              Questo annuncio è un esempio: villa, immagini, posizione e prezzo
              sono illustrativi. Non è possibile prenotare o inviare pagamenti.
            </p>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
