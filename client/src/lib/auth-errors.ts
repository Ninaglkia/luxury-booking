export const AUTH_UNAVAILABLE =
  "Servizio di accesso momentaneamente non disponibile, riprova più tardi";

export function getAuthErrorMessage(error: unknown): string {
  const details = error as { name?: string; message?: string; status?: number; code?: string } | null;
  const message = details?.message ?? "";
  if (
    (details?.status !== undefined && (details.status >= 500 || details.status === 0)) ||
    details?.name === "AuthRetryableFetchError" ||
    details?.code === "request_timeout" ||
    /failed to fetch|fetch failed|network|load failed|timeout|timed out/i.test(message)
  ) {
    return AUTH_UNAVAILABLE;
  }
  if (details?.code === "invalid_credentials") return "Email o password non corrette.";
  if (details?.code === "email_not_confirmed") return "Conferma la tua email prima di accedere.";
  return message || "Errore durante il login. Riprova ad accedere.";
}

export async function createServerSession(accessToken: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/auth/supabase-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ access_token: accessToken }),
    });
  } catch {
    throw new Error(AUTH_UNAVAILABLE);
  }
  if (response.status >= 500) throw new Error(AUTH_UNAVAILABLE);
  if (!response.ok) {
    throw new Error("Sessione non valida. Riprova ad accedere.");
  }
}
