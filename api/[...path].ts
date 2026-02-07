import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { oauthRouter } from "../server/_core/oauth";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Mount oauthRouter at root because Vercel rewrites might strip /api prefix
// or pass relative path.
// If req.url is /api/dev/login, and we mount at /, it expects /api/dev/login
// If req.url is /dev/login, and we mount at /, it expects /dev/login
// Our oauthRouter expects /dev/login.
// To cover all bases on Vercel:
app.use("/api", oauthRouter); // For when full path is preserved
app.use("/", oauthRouter);    // For when prefix is stripped

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export default function handler(req: any, res: any) {
  return app(req, res);
}
