import { useQuery } from "@tanstack/react-query";
import { Dumbbell } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOverlayState } from "@/hooks/use-overlay-state";
import { apiFetch } from "@/lib/api";
import type { Exercise } from "@/lib/queries";

export function ExerciseThumbnail({
  src,
  exerciseId,
  name = "exercise",
  className = "exercise-thumbnail",
  triggerClassName,
}: {
  src?: string | null;
  exerciseId?: number;
  name?: string;
  className?: string;
  triggerClassName?: string;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const [previewValue, setPreviewValue] = useOverlayState("preview");
  const open = exerciseId != null && previewValue === String(exerciseId);
  const setOpen = (next: boolean) => {
    if (exerciseId == null) return;
    setPreviewValue(next ? String(exerciseId) : null);
  };
  const mobile = useIsMobile();
  const media = (
    <span className={className} aria-hidden="true">
      {src && failed !== src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setFailed(src)}
        />
      ) : (
        <Dumbbell size={19} />
      )}
    </span>
  );
  if (!exerciseId) return media;
  const trigger = (
    <button
      type="button"
      className={`shrink-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring ${triggerClassName ?? ""}`}
      aria-label={`View ${name} details`}
      onClick={(event) => event.stopPropagation()}
    >
      {media}
    </button>
  );
  if (mobile)
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent onClick={(event) => event.stopPropagation()}>
          {open && (
            <ExerciseDetails exerciseId={exerciseId} name={name} mobile />
          )}
        </DrawerContent>
      </Drawer>
    );
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="max-h-[85dvh] overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        {open && <ExerciseDetails exerciseId={exerciseId} name={name} />}
      </DialogContent>
    </Dialog>
  );
}

function ExerciseDetails({
  exerciseId,
  name,
  mobile = false,
}: {
  exerciseId: number;
  name: string;
  mobile?: boolean;
}) {
  const detail = useQuery({
    queryKey: ["exercise-detail", exerciseId],
    queryFn: () =>
      apiFetch<{ data: Exercise }>(`/api/my/exercises/${exerciseId}`),
    staleTime: 300000,
  });
  const [failed, setFailed] = useState<string[]>([]);
  const exercise = detail.data?.data;
  const media = [exercise?.gifUrl, exercise?.imageUrl].find(
    (url) => url && !failed.includes(url),
  );
  const Header = mobile ? DrawerHeader : DialogHeader;
  const Title = mobile ? DrawerTitle : DialogTitle;
  const Description = mobile ? DrawerDescription : DialogDescription;
  return (
    <>
      <Header>
        <Title>{exercise?.name ?? name}</Title>
        <Description className="sr-only">
          Exercise demonstration and technique
        </Description>
      </Header>
      <ScrollArea
        className={mobile ? "min-h-0 flex-1 px-4" : "max-h-[70dvh] pr-3"}
      >
        <div className="min-h-[540px] space-y-5 pb-2">
          {detail.isPending && (
            <div
              className="min-h-[540px] space-y-4"
              role="status"
              aria-label="Loading exercise"
              aria-hidden="true"
            >
              <Skeleton className="mx-auto h-80 w-full rounded-xl" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-48" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          )}
          {detail.isError && (
            <div role="alert">
              Couldn’t load exercise details.{" "}
              <Button onClick={() => detail.refetch()}>Retry</Button>
            </div>
          )}
          {exercise && (
            <>
              {media ? (
                <div className="h-80 w-full overflow-hidden rounded-xl bg-white">
                  <img
                    src={media}
                    alt={`${exercise.name} demonstration`}
                    className="size-full object-contain"
                    onError={() => setFailed((current) => [...current, media])}
                  />
                </div>
              ) : (
                <p className="grid h-80 place-items-center rounded-xl bg-muted p-6 text-center">
                  No demonstration available.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Badge className="capitalize">
                  {exercise.target || exercise.muscleGroup}
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  {exercise.muscleGroup}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {exercise.equipment}
                </Badge>
              </div>
              {exercise.secondaryMuscles && (
                <p className="text-sm">
                  <strong>Secondary muscles: </strong>
                  {exercise.secondaryMuscles}
                </p>
              )}
              <div className="space-y-2">
                <h3 className="font-semibold">How to perform</h3>
                <p className="whitespace-pre-line rounded-lg border bg-muted/20 p-3 text-sm leading-relaxed text-muted-foreground">
                  {exercise.instructionsEn ||
                    "Instructions haven’t been added for this exercise yet."}
                </p>
              </div>
            </>
          )}
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </>
  );
}
