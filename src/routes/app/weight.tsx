import { createFileRoute, useBlocker } from "@tanstack/react-router";
import { Minus, Plus, RotateCcw, Scale, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { IconTile } from "@/components/app/icon-tile";
import { ChartSkeleton } from "@/components/app/loading-skeletons";
import { Panel, PanelHeading } from "@/components/app/panel";
import { ProgressChart } from "@/components/app/progress-chart";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InlineNote } from "@/components/ui/inline-note";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NoData } from "@/components/ui/no-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/responsive-dialog";
import { useOverlayState } from "@/hooks/use-overlay-state";
import { dateKey } from "@/lib/activity";
import {
  useDeleteBodyWeight,
  useLogBodyWeight,
  useMe,
  useMyBodyWeights,
} from "@/lib/my-queries";

export const Route = createFileRoute("/app/weight")({
  component: WeightPage,
});

const weighinChipClassName =
  "min-h-[38px] touch-manipulation rounded-full border border-border bg-background px-[14px] py-2 text-xs font-bold text-foreground transition-[background,transform] duration-150 hover:bg-accent active:scale-[0.96] aria-[pressed=true]:border-primary aria-[pressed=true]:bg-primary aria-[pressed=true]:text-primary-foreground";

function WeightPage() {
  const me = useMe();
  const [page, setPage] = useState(1);
  const history = useMyBodyWeights({ page });
  const latestHistory = useMyBodyWeights();
  const logWeight = useLogBodyWeight();
  const remove = useDeleteBodyWeight();
  const [deletingId, setDeletingId] = useOverlayState("delete-weighin");
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(() => dateKey(new Date()));
  const unit = me.data?.data.preferredUnit ?? "kg";
  const entries = history.data?.data ?? [];
  const deleting =
    deletingId === null
      ? null
      : (entries.find((entry) => String(entry.id) === deletingId) ?? null);
  const setDeleting = (next: { id: number } | null) =>
    setDeletingId(next === null ? null : String(next.id));
  const latest = latestHistory.data?.data[0];
  const defaultedRef = useRef(false);
  useEffect(() => {
    if (!defaultedRef.current && weight === "" && latest) {
      defaultedRef.current = true;
      setWeight(Number(latest.weight).toFixed(1));
    }
  }, [latest, weight]);
  const previous = latestHistory.data?.data[1];
  const delta =
    latest && previous ? Number(latest.weight) - Number(previous.weight) : null;
  const weightRows = useMemo(
    () =>
      [...(latestHistory.data?.data ?? [])].reverse().map((entry) => ({
        label: new Date(`${entry.recordedAt}T12:00:00`).toLocaleDateString(
          undefined,
          { month: "short", day: "numeric", year: "2-digit" },
        ),
        value: Number(entry.weight),
      })),
    [latestHistory.data],
  );
  const totalPages = history.data
    ? Math.max(1, Math.ceil(history.data.total / history.data.pageSize))
    : 1;
  const todayKey = dateKey(new Date());
  const yesterdayKey = dateKey(new Date(Date.now() - 86_400_000));
  const [showCustomDate, setShowCustomDate] = useState(false);
  const isCustomDate = date !== todayKey && date !== yesterdayKey;
  const parsedWeight = Number(weight);
  const weightValid =
    weight.trim() !== "" && Number.isFinite(parsedWeight) && parsedWeight > 0;
  const latestWeight = latest ? Number(latest.weight) : null;
  const liveDelta =
    weightValid && latestWeight !== null ? parsedWeight - latestWeight : null;
  const round1 = (n: number) => Math.round(n * 10) / 10;
  const nudge = (by: number) => {
    const current = Number(weight);
    const base = Number.isFinite(current)
      ? current
      : (latestWeight ?? Number.NaN);
    const next = round1(Math.max(0.1, (Number.isFinite(base) ? base : 0) + by));
    setWeight(next.toFixed(1));
  };
  const latestFormatted =
    latestWeight !== null ? latestWeight.toFixed(1) : null;
  const resetForm = () => {
    setWeight(latestFormatted ?? "");
    setDate(todayKey);
    setShowCustomDate(false);
  };
  const isDirty =
    !logWeight.isPending &&
    (latestFormatted !== null
      ? weight !== latestFormatted || date !== todayKey
      : weight.trim() !== "");
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;
  const blocker = useBlocker({
    shouldBlockFn: () => isDirtyRef.current,
    enableBeforeUnload: () => isDirtyRef.current,
    withResolver: true,
  });
  const saveAndProceed = async () => {
    if (blocker.status !== "blocked") {
      return;
    }
    if (!weightValid) {
      blocker.reset();
      return;
    }
    try {
      await logWeight.mutateAsync({
        weight: parsedWeight,
        recordedAt: date,
      });
      setWeight("");
      defaultedRef.current = false;
      setPage(1);
      toast.success("Saved");
      blocker.proceed();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save");
    }
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(weight);
    if (!weight.trim() || !Number.isFinite(value) || value <= 0) {
      toast.error("Enter weight > 0");
      return;
    }
    toast.promise(logWeight.mutateAsync({ weight: value, recordedAt: date }), {
      loading: "Saving…",
      success: () => {
        setWeight("");
        defaultedRef.current = false;
        setPage(1);
        return "Saved";
      },
      error: (error) => error.message,
    });
  };
  return (
    <div className="grid gap-6 max-mobile:gap-[18px]">
      <div className="mb-[5px] flex items-center justify-between gap-5">
        <div>
          <h1 className="text-[clamp(24px,2.35vw,34px)] leading-[1.3] font-bold tracking-[-1.25px] max-mobile:text-[28px] max-mobile:tracking-[-1.1px]">
            Weight<span className="text-chart-1">.</span>
          </h1>
        </div>
        <IconTile tone="blue">
          <Scale size={20} />
        </IconTile>
      </div>
      <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-[22px] max-tablet:grid-cols-1">
        <Panel>
          <PanelHeading>
            <div>
              <h2 className="text-[15px] font-bold tracking-[-0.35px]">
                Trend
              </h2>
            </div>
            <Scale size={19} />
          </PanelHeading>
          {latestHistory.isPending ? (
            <ChartSkeleton />
          ) : latestHistory.isError ? (
            <InlineNote className="[&_button]:underline [&_button]:underline-offset-[3px]">
              Couldn't load.{" "}
              <button type="button" onClick={() => latestHistory.refetch()}>
                Retry
              </button>
            </InlineNote>
          ) : latest ? (
            <>
              <p className="text-[39px] font-semibold tracking-[-1.5px]">
                {Number(latest.weight).toFixed(1)}
                <span className="ml-[6px] text-[15px] font-normal tracking-normal text-muted-foreground">
                  {unit}
                </span>
              </p>
              <p className="mt-[5px] mb-[15px] text-[11px] text-muted-foreground">
                {delta !== null
                  ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)} ${unit} vs prev`
                  : "First check-in."}
              </p>
              <ProgressChart
                rows={weightRows}
                label="Weight · last 30"
                kind="line"
                unit={unit}
              />
              <p className="mt-[6px] text-[10px] text-muted-foreground">
                Latest {weightRows.length}.
              </p>
            </>
          ) : (
            <NoData
              compact
              icon={Scale}
              title="Your progress starts here"
              description="Log your first weigh-in using the form to start tracking your trend."
            />
          )}
        </Panel>
        <Panel>
          <PanelHeading>
            <div>
              <h2 className="text-[15px] font-bold tracking-[-0.35px]">
                Log weight
              </h2>
            </div>
          </PanelHeading>
          <form
            className="grid gap-[18px] [&_label]:mb-[7px] [&_label]:text-[12px]"
            onSubmit={submit}
          >
            <div>
              <Label htmlFor="bw-weight">Weight</Label>
              <div className="mt-2 flex items-stretch gap-[10px]">
                <button
                  type="button"
                  className="grid min-h-[72px] shrink-0 grow-0 basis-[54px] touch-manipulation place-items-center rounded-[14px] border border-border bg-background text-foreground transition-[background,transform] duration-150 hover:bg-accent active:scale-[0.95] active:bg-accent"
                  aria-label="Decrease weight by 0.1"
                  onClick={() => nudge(-0.1)}
                >
                  <Minus size={20} />
                </button>
                <div className="min-w-0 flex-1 rounded-[14px] border border-border bg-background px-2 pt-[6px] pb-[10px] text-center focus-within:border-ring focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ring)_25%,transparent)]">
                  <input
                    id="bw-weight"
                    type="number"
                    min="0.1"
                    step="0.1"
                    inputMode="decimal"
                    placeholder={latest?.weight ?? "e.g. 70.0"}
                    required
                    aria-describedby="bw-delta"
                    value={weight}
                    onChange={(event) => setWeight(event.target.value)}
                    className="w-full border-0 bg-transparent p-0 text-center text-[44px] leading-[1.1] font-bold tracking-[-1.5px] text-foreground [appearance:textfield] outline-none [-moz-appearance:textfield] focus-visible:outline-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <span className="text-xs font-extrabold tracking-[1.2px] text-muted-foreground uppercase">
                    {unit}
                  </span>
                </div>
                <button
                  type="button"
                  className="grid min-h-[72px] shrink-0 grow-0 basis-[54px] touch-manipulation place-items-center rounded-[14px] border border-border bg-background text-foreground transition-[background,transform] duration-150 hover:bg-accent active:scale-[0.95] active:bg-accent"
                  aria-label="Increase weight by 0.1"
                  onClick={() => nudge(0.1)}
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
            <fieldset className="mx-0 mt-2 flex min-w-0 flex-wrap gap-2 border-0 p-0">
              <legend className="sr-only">Quick adjust</legend>
              {[-1, -0.5, 0.5, 1].map((step) => (
                <button
                  key={step}
                  type="button"
                  className={weighinChipClassName}
                  onClick={() => nudge(step)}
                >
                  {step > 0 ? `+${step}` : step}
                </button>
              ))}
            </fieldset>
            <p
              id="bw-delta"
              className="m-0 min-h-[20px] text-center text-xs text-muted-foreground [&_strong]:text-foreground"
              aria-live="polite"
            >
              {liveDelta !== null && latest ? (
                <>
                  <strong>
                    {liveDelta > 0 ? "+" : ""}
                    {liveDelta.toFixed(1)} {unit}
                  </strong>{" "}
                  vs last
                </>
              ) : (
                "Delta appears here."
              )}
            </p>
            <fieldset className="mx-0 min-w-0 border-0 p-0">
              <legend className="mb-[7px] p-0 text-[11px] font-medium">
                Date
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={weighinChipClassName}
                  aria-pressed={date === todayKey}
                  onClick={() => {
                    setDate(todayKey);
                    setShowCustomDate(false);
                  }}
                >
                  Today
                </button>
                <button
                  type="button"
                  className={weighinChipClassName}
                  aria-pressed={date === yesterdayKey}
                  onClick={() => {
                    setDate(yesterdayKey);
                    setShowCustomDate(false);
                  }}
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  className={weighinChipClassName}
                  aria-pressed={showCustomDate || isCustomDate}
                  aria-expanded={showCustomDate || isCustomDate}
                  aria-controls="bw-date"
                  onClick={() => setShowCustomDate(true)}
                >
                  Custom
                </button>
              </div>
            </fieldset>
            {(showCustomDate || isCustomDate) && (
              <div>
                <Label htmlFor="bw-date">Custom date</Label>
                <Input
                  id="bw-date"
                  type="date"
                  required
                  max={todayKey}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button
                className="min-w-0 flex-1"
                disabled={logWeight.isPending || !weightValid}
                type="submit"
                size="lg"
              >
                {logWeight.isPending
                  ? "Saving…"
                  : weightValid
                    ? `Save ${parsedWeight.toFixed(1)}`
                    : "Save"}
              </Button>
              {isDirty && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  aria-label="Discard changes"
                  onClick={resetForm}
                >
                  <RotateCcw size={17} />
                </Button>
              )}
            </div>
          </form>
        </Panel>
      </div>
      <Dialog
        open={blocker.status === "blocked"}
        onOpenChange={(open) => {
          if (!open && blocker.status === "blocked") {
            blocker.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Unsaved?</DialogTitle>
            <DialogDescription>
              Save
              {weightValid ? ` ${parsedWeight.toFixed(1)} ${unit}` : ""} or
              discard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              className="w-full"
              disabled={logWeight.isPending || !weightValid}
              onClick={saveAndProceed}
            >
              {logWeight.isPending ? "Saving…" : "Save"}
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                if (blocker.status === "blocked") {
                  blocker.proceed();
                }
              }}
            >
              Discard
            </Button>
            <Button
              className="w-full"
              variant="ghost"
              onClick={() => {
                if (blocker.status === "blocked") {
                  blocker.reset();
                }
              }}
            >
              Keep editing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Panel>
        <PanelHeading>
          <h2 className="text-[15px] font-bold tracking-[-0.35px]">History</h2>
          <span className="mt-[6px] text-[10px] text-muted-foreground">
            {history.data?.total ?? 0}
          </span>
        </PanelHeading>
        {history.isError ? (
          <InlineNote className="[&_button]:underline [&_button]:underline-offset-[3px]">
            Couldn't load.{" "}
            <button type="button" onClick={() => history.refetch()}>
              Retry
            </button>
          </InlineNote>
        ) : (
          <div className="grid grid-cols-3 gap-3 max-tablet:grid-cols-2 max-mobile:grid-cols-1">
            {entries.map((entry) => (
              <div
                className="flex items-center gap-2 rounded-[10px] border border-border p-[13px] [&_div]:flex-1"
                key={entry.id}
              >
                <IconTile tone="blue">
                  <Scale size={16} />
                </IconTile>
                <div>
                  <strong className="text-xs">
                    {entry.weight} {unit}
                  </strong>
                  <small className="mt-1 block text-[10px] text-muted-foreground">
                    {new Date(
                      `${entry.recordedAt}T12:00:00`,
                    ).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </small>
                </div>
                <Button
                  aria-label={`Delete weigh-in for ${entry.recordedAt}`}
                  disabled={remove.isPending}
                  size="icon"
                  variant="ghost"
                  onClick={() => setDeleting(entry)}
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            ))}
          </div>
        )}
        {history.data?.total === 0 && (
          <p className="mb-[22px] text-xs leading-[1.8] text-muted-foreground">
            No check-ins yet.
          </p>
        )}
        {totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="mt-[6px] text-[10px] text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                disabled={page <= 1 || history.isPending}
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                disabled={page >= totalPages || history.isPending}
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Panel>
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete entry?"
        description={
          deleting
            ? `Removes ${deleting.weight} ${unit} (${deleting.recordedAt}).`
            : "Removes entry."
        }
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleting) return;
          const id = deleting.id;
          toast.promise(remove.mutateAsync(id), {
            loading: "Deleting…",
            success: () => {
              if (entries.length === 1 && page > 1) setPage(page - 1);
              setDeleting(null);
              return "Entry deleted";
            },
            error: (error) => {
              setDeleting(null);
              return error.message;
            },
          });
        }}
      />
    </div>
  );
}
