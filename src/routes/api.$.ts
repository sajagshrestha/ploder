import { createFileRoute } from "@tanstack/react-router";

import { api } from "#/server/api";

async function handle({ request }: { request: Request }) {
  return api.fetch(request);
}

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
      PATCH: handle,
      PUT: handle,
      DELETE: handle,
    },
  },
});
