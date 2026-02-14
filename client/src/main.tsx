import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      async fetch(input, init) {
        const runRequest = (target: RequestInfo | URL) =>
          globalThis.fetch(target, {
            ...(init ?? {}),
            credentials: "include",
          });

        const getUrl = (target: RequestInfo | URL) =>
          typeof target === "string"
            ? target
            : target instanceof URL
              ? target.toString()
              : target instanceof Request
                ? target.url
                : "";

        const getFallbackTarget = (target: RequestInfo | URL): RequestInfo | URL => {
          if (typeof target === "string") {
            return target.replace("/api/trpc", "/trpc");
          }

          if (target instanceof URL) {
            const cloned = new URL(target.toString());
            cloned.pathname = cloned.pathname.replace("/api/trpc", "/trpc");
            return cloned;
          }

          return target;
        };

        let response = await runRequest(input);
        const contentType = response.headers.get("content-type") ?? "";
        const shouldRetryOnFallback =
          getUrl(input).includes("/api/trpc") &&
          (!response.ok || contentType.includes("text/html"));

        if (shouldRetryOnFallback) {
          response = await runRequest(getFallbackTarget(input));
        }

        return response;
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
