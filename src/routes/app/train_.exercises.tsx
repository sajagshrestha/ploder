import { createFileRoute } from "@tanstack/react-router";
import { TrainPage } from "@/components/app/training-page";

export const Route = createFileRoute("/app/train_/exercises")({
  component: () => <TrainPage manage />,
});
