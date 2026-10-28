import { afterEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

vi.mock("./db", () => ({ upsertUser: vi.fn().mockResolvedValue(undefined) }));
vi.mock("./_core/sdk", () => ({ sdk: { createSessionToken: vi.fn().mockResolvedValue("dev-token") } }));

import * as db from "./db";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";
import { oauthRouter } from "./_core/oauth";

const originalProduction = ENV.isProduction;
afterEach(() => {
  ENV.isProduction = originalProduction;
  vi.clearAllMocks();
});

describe("development login", () => {
  async function login() {
    const req = { protocol: "http", headers: {} } as Request;
    const res = { sendStatus: vi.fn(), cookie: vi.fn(), redirect: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() };
    const route = oauthRouter.stack.find(layer => layer.route?.path === "/dev/login")!.route;
    await route.stack[0].handle(req, res as unknown as Response, vi.fn());
    return res;
  }

  it("returns 404 in production without touching users or issuing a session", async () => {
    ENV.isProduction = true;
    const res = await login();
    expect(res.sendStatus).toHaveBeenCalledWith(404);
    expect(db.upsertUser).not.toHaveBeenCalled();
    expect(sdk.createSessionToken).not.toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it("still supports development login outside production", async () => {
    ENV.isProduction = false;
    const res = await login();
    expect(db.upsertUser).toHaveBeenCalledOnce();
    expect(sdk.createSessionToken).toHaveBeenCalledOnce();
    expect(res.cookie).toHaveBeenCalledOnce();
    expect(res.redirect).toHaveBeenCalledWith(302, "/");
    expect(res.sendStatus).not.toHaveBeenCalled();
  });
});
