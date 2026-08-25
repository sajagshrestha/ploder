import { SignInButton, UserButton } from "@clerk/tanstack-react-start";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ApiError, apiFetch, formatError } from "#/lib/api";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

type Me = { id: number; name: string; email: string; role: "user" | "admin" };

const navItems = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/exercises", label: "Exercises" },
  { to: "/admin/splits", label: "Splits" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/workouts", label: "Workouts" },
  { to: "/admin/body-weights", label: "Body Weight" },
];

function AdminLayout() {
  const [state, setState] = useState<
    "loading" | "ready" | "unauthenticated" | "forbidden"
  >("loading");

  useEffect(() => {
    apiFetch<{ data: Me }>("/api/me")
      .then((response) => {
        if (response.data.role !== "admin") {
          setState("forbidden");
        } else {
          setState("ready");
        }
      })
      .catch((error) => {
        setState(
          error instanceof ApiError && error.status === 401
            ? "unauthenticated"
            : "forbidden",
        );
      });
  }, []);

  if (state === "loading") {
    return (
      <div className="grid min-h-screen place-items-center text-sm">
        Checking access…
      </div>
    );
  }

  if (state === "unauthenticated") {
    return (
      <div className="grid min-h-screen place-items-center gap-4 p-8 text-center">
        <div>
          <h1 className="mb-2 text-2xl font-bold">Admin access</h1>
          <p className="mb-4 text-sm opacity-70">
            Sign in with an admin account to continue.
          </p>
          <SignInButton mode="modal">
            <button
              className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
              type="button"
            >
              Sign in
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  if (state === "forbidden") {
    return (
      <div className="grid min-h-screen place-items-center gap-4 p-8 text-center">
        <div>
          <h1 className="mb-2 text-2xl font-bold">Forbidden</h1>
          <p className="text-sm opacity-70">
            Your account does not have admin permissions. Ask an admin to grant
            access via ADMIN_EMAILS or the users panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-bold">Ploder Admin</span>
          <nav className="flex flex-wrap gap-x-4 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeProps={{ className: "font-bold underline" }}
                className="opacity-70 hover:opacity-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <UserButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4">
        <Outlet />
      </main>
    </div>
  );
}

export function useApi<T>(path: string | null, deps: unknown[] = []) {
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: true, error: null });

  // biome-ignore lint/correctness/useExhaustiveDependencies: nonce is a refetch trigger
  useEffect(() => {
    if (!path) {
      return;
    }
    setState((previous) => ({ ...previous, loading: true, error: null }));
    apiFetch<T>(path)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) =>
        setState({ data: null, loading: false, error: formatError(error) }),
      );
  }, [path, nonce, ...deps]);

  return { ...state, refetch: () => setNonce((current) => current + 1) };
}
