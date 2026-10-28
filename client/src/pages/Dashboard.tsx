import { useState } from "react";
import { Link } from "wouter";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { format, isAfter } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  AccountEmpty,
  AccountSectionHeader,
  AccountShell,
  type AccountNavItem,
} from "@/components/account/AccountShell";

type Section =
  | "overview"
  | "bookings"
  | "wishlist"
  | "reviews"
  | "profile"
  | "documents"
  | "notifications";

// Used when a booked or saved property has no photo of its own.
const FALLBACK_IMAGE = "/images/stay-country.jpg";

const STATUS_LABEL: Record<string, string> = {
  pending: "In attesa",
  confirmed: "Confermata",
  cancelled: "Annullata",
  completed: "Conclusa",
};

const euro = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
  // it-IT skips the thousands separator on 4-digit amounts ("6300 €") unless forced.
  useGrouping: "always",
});

function formatStay(checkIn: string | Date, checkOut: string | Date) {
  const from = new Date(checkIn);
  const to = new Date(checkOut);
  return `${format(from, "d MMM", { locale: it })} – ${format(to, "d MMM yyyy", { locale: it })}`;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [active, setActive] = useState<Section>("overview");

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("A presto");
      window.location.href = "/";
    },
  });

  const enabled = !!user;
  const bookings = trpc.bookings.myBookings.useQuery(undefined, { enabled });
  const wishlist = trpc.wishlist.getWishlist.useQuery(undefined, { enabled });
  const notifications = trpc.notifications.list.useQuery(undefined, {
    enabled,
  });

  if (loading) {
    return (
      <div className="stay-page account-loading" aria-busy="true">
        <p className="stay-eyebrow">Un momento…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="stay-page account-gate">
        <AccountEmpty
          title="Il tuo spazio ti aspetta"
          text="Accedi per vedere le tue prenotazioni, i luoghi che hai salvato e i messaggi con gli host."
          action={{ href: "/login", label: "Accedi" }}
        />
      </div>
    );
  }

  const unread = (notifications.data ?? []).filter(n => !n.isRead).length;
  const items: AccountNavItem<Section>[] = [
    { id: "overview", label: "Panoramica" },
    { id: "bookings", label: "Prenotazioni" },
    { id: "wishlist", label: "Preferiti" },
    { id: "reviews", label: "Recensioni" },
    { id: "profile", label: "Profilo" },
    { id: "documents", label: "Documenti" },
    { id: "notifications", label: "Notifiche", badge: unread },
  ];

  return (
    <AccountShell
      user={user}
      eyebrow="Il tuo spazio"
      items={items}
      active={active}
      onSelect={setActive}
      onLogout={() => logoutMutation.mutate()}
      loggingOut={logoutMutation.isPending}
    >
      {active === "overview" && (
        <OverviewSection
          user={user}
          bookings={bookings.data}
          bookingsLoading={bookings.isLoading}
          wishlistCount={wishlist.data?.length ?? 0}
          unread={unread}
          onNavigate={setActive}
        />
      )}
      {active === "bookings" && (
        <BookingsSection
          bookings={bookings.data}
          loading={bookings.isLoading}
        />
      )}
      {active === "wishlist" && (
        <WishlistSection items={wishlist.data} loading={wishlist.isLoading} />
      )}
      {active === "reviews" && <ReviewsSection />}
      {active === "profile" && <ProfileSection user={user} />}
      {active === "documents" && <DocumentsSection user={user} />}
      {active === "notifications" && (
        <NotificationsSection
          items={notifications.data}
          loading={notifications.isLoading}
          onRead={() => notifications.refetch()}
        />
      )}
    </AccountShell>
  );
}

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Booking = RouterOutputs["bookings"]["myBookings"][number];
type WishlistItem = RouterOutputs["wishlist"]["getWishlist"][number];
type NotificationItem = RouterOutputs["notifications"]["list"][number];

function OverviewSection({
  user,
  bookings,
  bookingsLoading,
  wishlistCount,
  unread,
  onNavigate,
}: {
  user: { name?: string | null; isVerified?: boolean | null };
  bookings?: Booking[];
  bookingsLoading: boolean;
  wishlistCount: number;
  unread: number;
  onNavigate: (section: Section) => void;
}) {
  const firstName = user.name?.split(" ")[0] || "di nuovo";
  const now = new Date();
  const upcoming = (bookings ?? [])
    .filter(
      b => b.status !== "cancelled" && isAfter(new Date(b.checkOutDate), now)
    )
    .sort((a, b) => +new Date(a.checkInDate) - +new Date(b.checkInDate));
  const next = upcoming[0];

  return (
    <>
      <AccountSectionHeader
        eyebrow="Panoramica"
        title={`Bentornato,`}
        accent={`${firstName}.`}
        lead="I tuoi viaggi, i luoghi che hai salvato e tutto ciò che serve per partire sereno."
      />

      <div className="account-stats">
        <button
          type="button"
          className="account-stat"
          onClick={() => onNavigate("bookings")}
        >
          <span className="account-stat-value">
            {bookingsLoading ? "–" : upcoming.length}
          </span>
          <span className="account-stat-label">Soggiorni in programma</span>
        </button>
        <button
          type="button"
          className="account-stat"
          onClick={() => onNavigate("wishlist")}
        >
          <span className="account-stat-value">{wishlistCount}</span>
          <span className="account-stat-label">Luoghi salvati</span>
        </button>
        <button
          type="button"
          className="account-stat"
          onClick={() => onNavigate("notifications")}
        >
          <span className="account-stat-value">{unread}</span>
          <span className="account-stat-label">Notifiche da leggere</span>
        </button>
      </div>

      <section className="account-block" aria-labelledby="next-trip">
        <div className="account-block-title">
          <h2 id="next-trip">Il tuo prossimo viaggio</h2>
        </div>
        {bookingsLoading ? (
          <div className="account-skeleton" style={{ height: 300 }} />
        ) : next ? (
          <article className="account-trip">
            <div className="account-trip-media">
              <img src={FALLBACK_IMAGE} alt="" />
            </div>
            <div className="account-trip-body">
              <p className="stay-eyebrow">
                {next.property?.city}
                {next.property?.country ? `, ${next.property.country}` : ""}
              </p>
              <h3>{next.property?.title ?? "La tua villa"}</h3>
              <p className="account-trip-dates">
                {formatStay(next.checkInDate, next.checkOutDate)} ·{" "}
                {next.numberOfGuests}{" "}
                {next.numberOfGuests === 1 ? "ospite" : "ospiti"}
              </p>
              <span className="account-status" data-status={next.status}>
                {STATUS_LABEL[next.status] ?? next.status}
              </span>
              <Link
                href={`/properties/${next.propertyId}`}
                className="account-text-link"
              >
                Rivedi la villa
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </article>
        ) : (
          <AccountEmpty
            title="Il prossimo ricordo comincia qui"
            text="Non hai soggiorni in programma. Lasciati ispirare dalla collezione e scegli il tuo altrove."
            action={{ href: "/search", label: "Esplora le ville" }}
          />
        )}
      </section>

      {!user.isVerified && (
        <aside className="account-notice">
          <ShieldCheck
            size={26}
            strokeWidth={1.3}
            color="#4c583e"
            aria-hidden="true"
          />
          <div>
            <h3>Verifica il tuo account</h3>
            <p>
              Un passaggio veloce che rassicura gli host e rende le tue
              richieste più semplici da accettare.
            </p>
            <Link href="/verification" className="account-text-link">
              Verifica ora
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </aside>
      )}
    </>
  );
}

function BookingsSection({
  bookings,
  loading,
}: {
  bookings?: Booking[];
  loading: boolean;
}) {
  return (
    <>
      <AccountSectionHeader
        eyebrow="Prenotazioni"
        title="I tuoi"
        accent="soggiorni."
        lead="Tutte le richieste e le prenotazioni, dalla più recente."
      />
      {loading ? (
        <div className="account-skeleton" />
      ) : bookings && bookings.length > 0 ? (
        <div className="account-booking-list">
          {bookings.map(booking => (
            <article key={booking.id} className="account-booking">
              <div className="account-booking-thumb">
                <img src={FALLBACK_IMAGE} alt="" />
              </div>
              <div>
                <h3>
                  <Link href={`/properties/${booking.propertyId}`}>
                    {booking.property?.title ?? "Villa"}
                  </Link>
                </h3>
                <p className="account-booking-meta">
                  {booking.property?.city} ·{" "}
                  {formatStay(booking.checkInDate, booking.checkOutDate)} ·{" "}
                  {booking.numberOfGuests}{" "}
                  {booking.numberOfGuests === 1 ? "ospite" : "ospiti"}
                </p>
              </div>
              <div className="account-booking-price">
                <strong>{euro.format(booking.totalPrice)}</strong>
                <span className="account-status" data-status={booking.status}>
                  {STATUS_LABEL[booking.status] ?? booking.status}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <AccountEmpty
          title="Nessun soggiorno, per ora"
          text="Quando prenoti una villa la trovi qui, con date, ospiti e stato della richiesta."
          action={{ href: "/search", label: "Trova la tua villa" }}
        />
      )}
    </>
  );
}

function WishlistSection({
  items,
  loading,
}: {
  items?: WishlistItem[];
  loading: boolean;
}) {
  const saved = (items ?? []).filter(item => item.property);
  return (
    <>
      <AccountSectionHeader
        eyebrow="Preferiti"
        title="I luoghi che"
        accent="ti somigliano."
        lead="Le ville che hai salvato, pronte quando lo sei tu."
      />
      {loading ? (
        <div className="account-skeleton" />
      ) : saved.length > 0 ? (
        <div className="account-grid">
          {saved.map(item => {
            const property = item.property!;
            const image =
              (property as { firstImage?: string }).firstImage ||
              FALLBACK_IMAGE;
            return (
              <Link
                key={item.id}
                href={`/properties/${property.id}`}
                className="account-card"
              >
                <div className="account-card-media">
                  <img src={image} alt={property.title} />
                </div>
                <h3>{property.title}</h3>
                <p>{euro.format(property.pricePerNight)} a notte</p>
              </Link>
            );
          })}
        </div>
      ) : (
        <AccountEmpty
          title="Nessun luogo salvato"
          text="Tocca il cuore su una villa per ritrovarla qui quando vuoi."
          action={{ href: "/search", label: "Esplora la collezione" }}
        />
      )}
    </>
  );
}

function ReviewsSection() {
  return (
    <>
      <AccountSectionHeader
        eyebrow="Recensioni"
        title="I tuoi"
        accent="ricordi."
        lead="Dopo ogni soggiorno potrai raccontare com'è andata: aiuta gli altri ospiti e ringrazia chi ti ha accolto."
      />
      <AccountEmpty
        title="Ancora nessuna recensione"
        text="La possibilità di scrivere una recensione arriva alla fine del tuo primo soggiorno."
      />
    </>
  );
}

function ProfileSection({
  user,
}: {
  user: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    role?: string | null;
  };
}) {
  const rows: Array<[string, string | null | undefined]> = [
    ["Nome", user.name],
    ["Email", user.email],
    ["Telefono", user.phone],
  ];
  return (
    <>
      <AccountSectionHeader
        eyebrow="Profilo"
        title="Chi"
        accent="sei."
        lead="I dati che gli host vedono quando ricevono una tua richiesta."
      />
      <dl className="account-rows">
        {rows.map(([label, value]) => (
          <div key={label} className="account-row">
            <dt>{label}</dt>
            <dd className={value ? undefined : "is-empty"}>
              {value || "Non indicato"}
            </dd>
            <span />
          </div>
        ))}
      </dl>
      <div className="account-block">
        <Link href="/profile" className="account-button">
          Modifica il profilo
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </>
  );
}

// Show only the last characters of an ID number: the full number never needs to be on screen.
function maskDocumentNumber(value?: string | null) {
  if (!value) return "Non indicato";
  return value.length <= 4 ? "••••" : `•••• ${value.slice(-4)}`;
}

function DocumentsSection({
  user,
}: {
  user: {
    idDocumentUrl?: string | null;
    idDocumentType?: string | null;
    idDocumentNumber?: string | null;
    idDocumentVerified?: boolean | null;
  };
}) {
  return (
    <>
      <AccountSectionHeader
        eyebrow="Documenti"
        title="Identità"
        accent="verificata."
        lead="Un documento valido ci permette di tutelare te e chi ti ospita."
      />
      {user.idDocumentUrl ? (
        <dl className="account-rows">
          <div className="account-row">
            <dt>Tipo</dt>
            <dd>{user.idDocumentType || "Documento"}</dd>
            <span />
          </div>
          <div className="account-row">
            <dt>Numero</dt>
            <dd>{maskDocumentNumber(user.idDocumentNumber)}</dd>
            <span />
          </div>
          <div className="account-row">
            <dt>Stato</dt>
            <dd>
              <span
                className="account-status"
                data-status={user.idDocumentVerified ? "confirmed" : "pending"}
              >
                {user.idDocumentVerified ? "Verificato" : "In verifica"}
              </span>
            </dd>
            <span />
          </div>
        </dl>
      ) : (
        <AccountEmpty
          title="Nessun documento caricato"
          text="Completa la verifica per prenotare più velocemente e con la fiducia degli host."
          action={{ href: "/verification", label: "Inizia la verifica" }}
        />
      )}
    </>
  );
}

function NotificationsSection({
  items,
  loading,
  onRead,
}: {
  items?: NotificationItem[];
  loading: boolean;
  onRead: () => void;
}) {
  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: onRead,
  });
  return (
    <>
      <AccountSectionHeader
        eyebrow="Notifiche"
        title="Cosa c'è"
        accent="di nuovo."
        lead="Conferme, messaggi e aggiornamenti sulle tue prenotazioni."
      />
      {loading ? (
        <div className="account-skeleton" />
      ) : items && items.length > 0 ? (
        <div className="account-rows">
          {items.map(item => (
            <article
              key={item.id}
              className={`account-notification${item.isRead ? "" : " is-unread"}`}
            >
              <span className="account-notification-dot" aria-hidden="true" />
              <div>
                <h3>{item.title}</h3>
                <p>{item.message}</p>
                {!item.isRead && (
                  <button
                    type="button"
                    className="account-text-link account-text-button"
                    onClick={() => markAsRead.mutate({ id: item.id })}
                    disabled={markAsRead.isPending}
                  >
                    Segna come letta
                  </button>
                )}
              </div>
              <time dateTime={new Date(item.createdAt).toISOString()}>
                {format(new Date(item.createdAt), "d MMM", { locale: it })}
              </time>
            </article>
          ))}
        </div>
      ) : (
        <AccountEmpty
          title="Tutto tranquillo"
          text="Quando un host ti risponde o una prenotazione cambia stato, lo trovi qui."
        />
      )}
    </>
  );
}
