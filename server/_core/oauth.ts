import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import { type Request, type Response, Router } from "express";
import { createClient } from "@supabase/supabase-js";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

function getSupabaseAdmin() {
  if (!ENV.supabaseUrl) {
    throw new Error("VITE_SUPABASE_URL is not set");
  }
  // Service role key is preferred (admin access); anon key works for getUser() as fallback.
  const key = ENV.supabaseServiceRoleKey || ENV.supabaseAnonKey;
  if (!key) {
    throw new Error("Neither SUPABASE_SERVICE_ROLE_KEY nor VITE_SUPABASE_ANON_KEY is set");
  }
  console.log("[Auth] Supabase client using key type:", ENV.supabaseServiceRoleKey ? "service_role" : "anon");
  return createClient(ENV.supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const oauthRouter = Router();

// Dev-only login (crea utente dummy senza bisogno di credenziali)
oauthRouter.get("/dev/login", async (req: Request, res: Response) => {
  try {
    const dummyUser = {
      openId: "dev-user-123",
      name: "Developer User",
      email: "dev@example.com",
      loginMethod: "dev",
      lastSignedIn: new Date(),
    };

    await db.upsertUser(dummyUser);

    const sessionToken = await sdk.createSessionToken(dummyUser.openId, {
      name: dummyUser.name,
      expiresInMs: ONE_YEAR_MS,
    });

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

    res.redirect(302, "/");
  } catch (error) {
    console.error("[Auth] Dev login failed", error);
    res.status(500).json({ error: "Dev login failed" });
  }
});

// Endpoint chiamato dal frontend dopo il login con Supabase Auth.
// Riceve l'access_token di Supabase, lo verifica, crea/aggiorna l'utente nel DB
// e imposta il cookie di sessione JWT (meccanismo identico a prima).
oauthRouter.post("/auth/supabase-session", async (req: Request, res: Response) => {
  const { access_token } = req.body ?? {};

  if (!access_token || typeof access_token !== "string") {
    res.status(400).json({ error: "access_token is required" });
    return;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(access_token);

    if (error || !data.user) {
      console.error("[Auth] Invalid Supabase token. Error:", error?.message ?? "no user returned");
      console.error("[Auth] supabaseUrl:", ENV.supabaseUrl ? "set" : "MISSING");
      console.error("[Auth] serviceRoleKey:", ENV.supabaseServiceRoleKey ? "set" : "MISSING");
      console.error("[Auth] anonKey:", ENV.supabaseAnonKey ? "set" : "MISSING");
      res.status(401).json({ error: error?.message ?? "Invalid token" });
      return;
    }

    const supabaseUser = data.user;
    const openId = supabaseUser.id; // UUID Supabase → usato come openId
    const email = supabaseUser.email ?? null;
    const name =
      (supabaseUser.user_metadata?.full_name as string | undefined) ??
      (supabaseUser.user_metadata?.name as string | undefined) ??
      email?.split("@")[0] ??
      "User";
    const loginMethod = supabaseUser.app_metadata?.provider ?? "email";

    await db.upsertUser({
      openId,
      name,
      email,
      loginMethod,
      lastSignedIn: new Date(),
    });

    // Verify user was actually persisted in DB
    const savedUser = await db.getUserByOpenId(openId);
    if (!savedUser) {
      console.error("[Auth] User not found in DB after upsert — database connection may be failing");
      res.status(500).json({ error: "Database error: user could not be created" });
      return;
    }

    const sessionToken = await sdk.createSessionToken(openId, {
      name,
      expiresInMs: ONE_YEAR_MS,
    });

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

    res.json({ success: true });
  } catch (error) {
    console.error("[Auth] Supabase session error", error);
    res.status(500).json({ error: "Session creation failed" });
  }
});

export function registerOAuthRoutes(app: any) {
  app.use("/api", oauthRouter);
}
