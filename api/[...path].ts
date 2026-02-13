import express, { type Express } from "express";
import type { Request, Response } from "express";

let appPromise: Promise<Express> | null = null;

async function createApiApp(): Promise<Express> {
  const [{ createExpressMiddleware }, { appRouter }, { createContext }, { oauthRouter }] =
    await Promise.all([
      import("@trpc/server/adapters/express"),
      import("../server/routers"),
      import("../server/_core/context"),
      import("../server/_core/oauth"),
    ]);

  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.use("/api", oauthRouter);
  app.use("/", oauthRouter);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  app.use(
    "/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}

async function getApiApp(): Promise<Express> {
  if (!appPromise) {
    appPromise = createApiApp();
  }

  return appPromise;
}

export default async function handler(req: Request, res: Response) {
  try {
    const app = await getApiApp();
    return app(req, res);
  } catch (error) {
    console.error("[API] Bootstrap failed", error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "API bootstrap failed", message });
  }
}
