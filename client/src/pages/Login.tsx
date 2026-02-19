import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const schema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(6, "Password min 6 caratteri"),
});

type FormData = z.infer<typeof schema>;
type Mode = "login" | "register";

const CALLBACK_URL = `${window.location.origin}/auth/callback`;

async function signInWithProvider(provider: "google" | "apple") {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: CALLBACK_URL },
  });
  if (error) toast.error(error.message);
}

export default function Login() {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      let accessToken: string;

      if (mode === "register") {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        if (!signUpData.session) {
          toast.success("Registrazione completata! Controlla la tua email per confermare l'account, poi accedi.");
          setMode("login");
          return;
        }
        accessToken = signUpData.session.access_token;
      } else {
        const { data: signInData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        accessToken = signInData.session.access_token;
      }

      await exchangeToken(accessToken);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  }

  async function handleSocial(provider: "google" | "apple") {
    setSocialLoading(provider);
    await signInWithProvider(provider);
    setSocialLoading(null);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {mode === "login" ? "Accedi" : "Crea account"}
          </CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Inserisci le tue credenziali per continuare"
              : "Registrati per iniziare"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Social login */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              disabled={!!socialLoading}
              onClick={() => handleSocial("google")}
            >
              {socialLoading === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Continua con Google
            </Button>

            {/* Apple OAuth — richiede Apple Developer Account (99$/anno), abilitare quando pronto
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              disabled={!!socialLoading}
              onClick={() => handleSocial("apple")}
            >
              {socialLoading === "apple" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <AppleIcon />
              )}
              Continua con Apple
            </Button>
            */}
          </div>

          <div className="flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">oppure</span>
            <Separator className="flex-1" />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tua@email.com"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "login" ? "Accedi" : "Registrati"}
            </Button>
          </form>

          <div className="text-center text-sm">
            {mode === "login" ? (
              <>
                Non hai un account?{" "}
                <button type="button" onClick={() => setMode("register")} className="underline font-medium">
                  Registrati
                </button>
              </>
            ) : (
              <>
                Hai già un account?{" "}
                <button type="button" onClick={() => setMode("login")} className="underline font-medium">
                  Accedi
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

export async function exchangeToken(accessToken: string) {
  const res = await fetch("/api/auth/supabase-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ access_token: accessToken }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error ?? "Errore durante il login");
  }
  window.location.href = "/";
}

// ── SVG Icons ──────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 814 1000" aria-hidden="true" fill="currentColor">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.3-164-39.3c-76 0-103.7 40.8-165.9 40.8s-105.3-57.8-155.5-127.4C46 411.8 0 307.4 0 210.4c0-189.5 123.4-289.8 244.8-289.8 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
    </svg>
  );
}
