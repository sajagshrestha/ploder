import { createFileRoute, useBlocker } from "@tanstack/react-router";
import { Minus, Plus, RotateCcw, Scale, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ProgressChart } from "@/components/app/progress-chart";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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

function WeightPage() {
  const me = useMe();
  const [page, setPage] = useState(1);
  const history = useMyBodyWeights({ page });
  const latestHistory = useMyBodyWeights();
  const logWeight = useLogBodyWeight();
  const remove = useDeleteBodyWeight();
  const [deleting, setDeleting] = useState<{
    id: number;
    weight: string;
    recordedAt: string;
  } | null>(null);
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(() => dateKey(new Date()));
  const unit = me.data?.data.preferredUnit ?? "kg";
  const entries = history.data?.data ?? [];
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
      toast.success("Weigh-in saved");
      blocker.proceed();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn't save weigh-in",
      );
    }
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(weight);
    if (!weight.trim() || !Number.isFinite(value) || value <= 0) {
      toast.error("Enter a weight greater than zero");
      return;
    }
    toast.promise(logWeight.mutateAsync({ weight: value, recordedAt: date }), {
      loading: "Saving weigh-in…",
      success: () => {
        setWeight("");
        defaultedRef.current = false;
        setPage(1);
        return "Weigh-in saved";
      },
      error: (error) => error.message,
    });
  };
  return (
    <div className="progress-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">CHECK IN WITH YOURSELF</p>
          <h1>
            Body weight<span className="heading-dot">.</span>
          </h1>
          <p>
            A single number is just a snapshot. Regular check-ins reveal your
            pattern.
          </p>
        </div>
        <span className="icon-tile blue">
          <Scale size={20} />
        </span>
      </div>
      <div className="progress-layout">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">CHECK IN WITH YOURSELF</p>
              <h2>Body weight trend</h2>
            </div>
            <Scale size={19} />
          </div>
          {latestHistory.isPending ? (
            <Skeleton className="h-52" />
          ) : latestHistory.isError ? (
            <div className="inline-error">
              Couldn’t load weigh-ins.{" "}
              <button type="button" onClick={() => latestHistory.refetch()}>
                Retry
              </button>
            </div>
          ) : latest ? (
            <>
              <p className="weight-value">
                {Number(latest.weight).toFixed(1)}
                <span>{unit}</span>
              </p>
              <p className="weight-delta">
                {delta !== null
                  ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)} ${unit} since your previous check-in`
                  : "Your first check-in. A starting point to build on."}
              </p>
              <ProgressChart
                rows={weightRows}
                label="Body weight across your latest 30 weigh-ins"
                kind="line"
                unit={unit}
              />
              <p className="chart-data">
                Showing your latest {weightRows.length} weigh-ins.
              </p>
            </>
          ) : (
            <div className="plan-empty">
              <Scale size={28} />
              <h3>A starting point, not a score.</h3>
              <p>Log your first weigh-in to start seeing your trend here.</p>
            </div>
          )}
        </section>
        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">A MOMENT FOR YOU</p>
              <h2>Log a weigh-in</h2>
            </div>
          </div>
          <p className="form-help">
            Big targets for the gym floor — tap to fine-tune, or type your exact
            number.
          </p>
          <form className="form-stack" onSubmit={submit}>
            <div>
              <Label htmlFor="bw-weight">Weight</Label>
              <div className="weighin-stepper">
                <button
                  type="button"
                  className="weighin-step-btn"
                  aria-label="Decrease weight by 0.1"
                  onClick={() => nudge(-0.1)}
                >
                  <Minus size={20} />
                </button>
                <div className="weighin-display">
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
                  />
                  <span className="weighin-unit">{unit}</span>
                </div>
                <button
                  type="button"
                  className="weighin-step-btn"
                  aria-label="Increase weight by 0.1"
                  onClick={() => nudge(0.1)}
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
            <fieldset className="weighin-chips">
              <legend className="sr-only">Quick adjust</legend>
              {[-1, -0.5, 0.5, 1].map((step) => (
                <button
                  key={step}
                  type="button"
                  className="weighin-chip"
                  onClick={() => nudge(step)}
                >
                  {step > 0 ? `+${step}` : step}
                </button>
              ))}
            </fieldset>
            <p id="bw-delta" className="weighin-delta" aria-live="polite">
              {liveDelta !== null && latest ? (
                <>
                  <strong>
                    {liveDelta > 0 ? "+" : ""}
                    {liveDelta.toFixed(1)} {unit}
                  </strong>{" "}
                  vs last (
                  {new Date(`${latest.recordedAt}T12:00:00`).toLocaleDateString(
                    undefined,
                    {
                      month: "short",
                      day: "numeric",
                    },
                  )}
                  )
                </>
              ) : (
                "Your delta vs your last check-in appears here."
              )}
            </p>
            <fieldset className="weighin-fieldset">
              <legend>Date</legend>
              <div className="weighin-chips">
                <button
                  type="button"
                  className="weighin-chip"
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
                  className="weighin-chip"
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
                  className="weighin-chip"
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
            <div className="weighin-actions">
              <Button
                className="weighin-save"
                disabled={logWeight.isPending || !weightValid}
                type="submit"
                size="lg"
              >
                {logWeight.isPending
                  ? "Saving…"
                  : weightValid
                    ? `Save ${parsedWeight.toFixed(1)} ${unit}`
                    : "Save weigh-in"}
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
        </section>
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
            <DialogTitle>Unsaved weigh-in</DialogTitle>
            <DialogDescription>
              You have an unsaved weigh-in
              {weightValid ? ` of ${parsedWeight.toFixed(1)} ${unit}` : ""}.
              Save it before leaving, or discard your changes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              className="w-full"
              disabled={logWeight.isPending || !weightValid}
              onClick={saveAndProceed}
            >
              {logWeight.isPending ? "Saving…" : "Save weigh-in"}
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
              Discard changes
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
      <section className="dashboard-panel">
        <div className="panel-heading">
          <h2>Your check-ins</h2>
          <span className="chart-data">{history.data?.total ?? 0} entries</span>
        </div>
        {history.isError ? (
          <div className="inline-error">
            Couldn’t load check-ins.{" "}
            <button type="button" onClick={() => history.refetch()}>
              Retry
            </button>
          </div>
        ) : (
          <div className="weight-history-list">
            {entries.map((entry) => (
              <div className="weight-history-entry" key={entry.id}>
                <span className="icon-tile blue">
                  <Scale size={16} />
                </span>
                <div>
                  <strong>
                    {entry.weight} {unit}
                  </strong>
                  <small>
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
          <p className="form-help">
            Your check-ins will appear here once you save your first weigh-in.
          </p>
        )}
        {totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="chart-data">
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
      </section>
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this weigh-in?"
        description={
          deleting
            ? `This permanently removes your ${deleting.weight} ${unit} check-in from ${new Date(`${deleting.recordedAt}T12:00:00`).toLocaleDateString(undefined, { dateStyle: "medium" })}. This can't be undone.`
            : "This permanently removes this check-in. This can't be undone."
        }
        confirmLabel="Delete entry"
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
