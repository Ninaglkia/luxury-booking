import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { exchangeToken } from "./Login";
import { Loader2 } from "lucide-react";

// Questa pagina gestisce il ritorno da Google/Apple OAuth.
// Supabase reindirizza qui con i token nell'URL hash (#access_token=...).
// Leggiamo la sessione, la mandiamo al server per creare il cookie JWT, e
// reindirizziamo a home.

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        // getSession() legge automaticamente i token dall'URL hash
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (!data.session) {
          // Può capitare se il link è scaduto o già usato
          setError("Sessione non valida. Riprova ad accedere.");
          return;
        }

        await exchangeToken(data.session.access_token);
        // exchangeToken fa già il redirect a "/"
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Errore durante il login");
      }
    }

    handleCallback();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-destructive font-medium">{error}</p>
        <a href="/login" className="underline text-sm">Torna al login</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Accesso in corso…</p>
      </div>
    </div>
  );
}
