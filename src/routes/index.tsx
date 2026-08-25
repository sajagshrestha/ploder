import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <main className="grid min-h-screen place-items-center">
      <h1 className="text-4xl font-bold tracking-tight">Hello World</h1>
    </main>
  );
}
