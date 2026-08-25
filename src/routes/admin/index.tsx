import { createFileRoute } from "@tanstack/react-router";

import { useApi } from "../admin";

type Stats = {
  exercises: number;
  splits: number;
  users: number;
  admins: number;
  workouts: number;
  completedWorkouts: number;
  sets: number;
  bodyWeights: number;
};

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data, loading, error } = useApi<{ data: Stats }>("/api/stats");

  if (loading) {
    return <p className="text-sm opacity-70">Loading stats…</p>;
  }
  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }
  if (!data) {
    return null;
  }

  const cards: [string, string | number][] = [
    ["Exercises", data.data.exercises],
    ["Split templates", data.data.splits],
    ["Users", data.data.users],
    ["Admins", data.data.admins],
    ["Workouts", data.data.workouts],
    ["Completed workouts", data.data.completedWorkouts],
    ["Sets logged", data.data.sets],
    ["Body weight entries", data.data.bodyWeights],
  ];

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-xl border p-4">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm opacity-70">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
