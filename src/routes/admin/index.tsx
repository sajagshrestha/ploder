import { createFileRoute } from "@tanstack/react-router";
import { Activity, CalendarDays, Dumbbell, Scale, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStats } from "@/lib/queries";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data, isPending } = useStats();

  const cards = [
    { label: "Exercises", value: data?.data.exercises, icon: Dumbbell },
    { label: "Split templates", value: data?.data.splits, icon: CalendarDays },
    { label: "Users", value: data?.data.users, icon: Users },
    { label: "Admins", value: data?.data.admins, icon: Users },
    { label: "Workouts", value: data?.data.workouts, icon: Activity },
    {
      label: "Completed workouts",
      value: data?.data.completedWorkouts,
      icon: Activity,
    },
    { label: "Sets logged", value: data?.data.sets, icon: Dumbbell },
    {
      label: "Body weight entries",
      value: data?.data.bodyWeights,
      icon: Scale,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your Ploder application data.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.label}
              </CardTitle>
              <card.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isPending ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">{card.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
