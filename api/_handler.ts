import express from "express";
import type { Request, Response } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { oauthRouter } from "../server/_core/oauth";

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

export default async function handler(req: Request, res: Response) {
  try {
    return app(req, res);
  } catch (error) {
    console.error("[API] Bootstrap failed", error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "API bootstrap failed", message });
  }
}
