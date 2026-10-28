import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowUpRight, House, LogOut } from "lucide-react";
import "@/styles/stay.css";
import "@/styles/account.css";

export type AccountNavItem<T extends string> = {
  id: T;
  label: string;
  badge?: number;
};

type AccountShellProps<T extends string> = {
  user: { name?: string | null; email?: string | null; role?: string | null };
  eyebrow: string;
  items: AccountNavItem<T>[];
  active: T;
  onSelect: (id: T) => void;
  onLogout: () => void;
  loggingOut?: boolean;
  children: ReactNode;
};

const ROLE_LABEL: Record<string, string> = {
  guest: "Ospite",
  host: "Host",
  admin: "Amministratore",
};

export function initialsOf(name?: string | null, email?: string | null) {
  const source = (name || email || "?").trim();
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}

export function AccountShell<T extends string>({
  user,
  eyebrow,
  items,
  active,
  onSelect,
  onLogout,
  loggingOut,
  children,
}: AccountShellProps<T>) {
  return (
    <div className="stay-page account-page">
      <a className="stay-skip" href="#account-content">
        Vai al contenuto
      </a>
      <header className="stay-header">
        <Link href="/" className="stay-brand" aria-label="LuxuryStay, pagina iniziale">
          <span className="stay-brand-mark" aria-hidden="true">
            <House size={21} strokeWidth={1.3} />
          </span>
          <span>
            Luxury<span className="stay-brand-italic">Stay</span>
            <small>EXCEPTIONAL PLACES. YOUR WAY.</small>
          </span>
        </Link>
        <nav className="stay-desktop-nav" aria-label="Navigazione principale">
          <Link href="/">Home</Link>
          <Link href="/search">Le nostre ville</Link>
          <Link href="/messages">Messaggi</Link>
        </nav>
        <div className="account-header-actions">
          <Link href="/search" className="stay-account">
            Trova una villa
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </header>

      <div className="account-layout">
        <aside className="account-rail" aria-label="Il tuo account">
          <div className="account-identity">
            <span className="account-monogram" aria-hidden="true">
              {initialsOf(user.name, user.email)}
            </span>
            <div className="account-identity-text">
              <p className="account-name">{user.name || "Il tuo account"}</p>
              {user.email && <p className="account-email">{user.email}</p>}
              {user.role && (
                <p className="account-role">{ROLE_LABEL[user.role] ?? user.role}</p>
              )}
            </div>
          </div>

          <p className="stay-eyebrow account-rail-eyebrow">{eyebrow}</p>
          <nav className="account-nav">
            {items.map(item => (
              <button
                key={item.id}
                type="button"
                className="account-nav-item"
                aria-current={item.id === active ? "page" : undefined}
                onClick={() => onSelect(item.id)}
              >
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="account-nav-badge">{item.badge}</span>
                ) : null}
              </button>
            ))}
          </nav>

          <button
            type="button"
            className="account-logout"
            onClick={onLogout}
            disabled={loggingOut}
          >
            <LogOut size={15} strokeWidth={1.5} />
            {loggingOut ? "Uscita in corso…" : "Esci dall'account"}
          </button>
        </aside>

        <main id="account-content" className="account-main">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AccountSectionHeader({
  eyebrow,
  title,
  accent,
  lead,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  lead?: string;
}) {
  return (
    <div className="account-section-header">
      <p className="stay-eyebrow">{eyebrow}</p>
      <h1>
        {title} {accent && <em>{accent}</em>}
      </h1>
      {lead && <p className="account-lead">{lead}</p>}
    </div>
  );
}

export function AccountEmpty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="account-empty">
      <span className="stay-brand-mark account-empty-mark" aria-hidden="true">
        <House size={19} strokeWidth={1.2} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      {action && (
        <Link href={action.href} className="account-text-link">
          {action.label}
          <ArrowUpRight size={14} />
        </Link>
      )}
    </div>
  );
}
