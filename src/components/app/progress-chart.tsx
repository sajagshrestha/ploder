import { barY, defineChart, dot, lineY } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { scalePoint } from "@tanstack/charts/scales/point";
import { tooltip } from "@tanstack/charts/tooltip";
import { useMemo } from "react";

export type ProgressPoint = { label: string; value: number };
const theme = {
  foreground: "var(--foreground)",
  muted: "var(--muted-foreground)",
  grid: "var(--border)",
  background: "transparent",
  palette: ["var(--chart-1)"],
};

export function ProgressChart({
  rows,
  label,
  kind = "bar",
  unit = "sessions",
  rowHeader = "Date",
}: {
  rows: ProgressPoint[];
  label: string;
  kind?: "bar" | "line";
  unit?: string;
  rowHeader?: string;
}) {
  const definition = useMemo(
    () =>
      defineChart({
        marks:
          kind === "bar"
            ? [
                barY(rows, {
                  x: "label",
                  y: "value",
                  fill: "var(--chart-1)",
                  radius: 5,
                }),
              ]
            : [
                lineY(rows, {
                  x: "label",
                  y: "value",
                  stroke: "var(--chart-1)",
                  strokeWidth: 3,
                }),
                dot(rows, {
                  x: "label",
                  y: "value",
                  fill: "var(--chart-1)",
                  r: 4,
                }),
              ],
        scales: {
          x: {
            scale:
              kind === "bar"
                ? () => scaleBand().padding(0.45)
                : () => scalePoint().padding(0.4),
            axis: { label: "" },
          },
          y: {
            scale: scaleLinear,
            nice: true,
            grid: true,
            ...(kind === "bar"
              ? {
                  domain: [
                    0,
                    Math.max(4, ...rows.map((r) => r.value)),
                  ] as const,
                }
              : {}),
            axis: {
              label: "",
              ticks: {
                count: 4,
                format: (v) =>
                  kind === "bar"
                    ? Number.isInteger(v)
                      ? String(v)
                      : ""
                    : String(v),
              },
            },
          },
        },
        theme,
        tooltip,
        margin: { top: 16, right: 12, bottom: 32, left: 35 },
      }),
    [rows, kind],
  );

  return (
    <div className="progress-chart">
      <Chart
        definition={definition}
        height={220}
        initialWidth={520}
        ariaLabel={label}
      />
      <details className="chart-data">
        <summary>View chart data</summary>
        <table>
          <caption>{label}</caption>
          <thead>
            <tr>
              <th scope="col">{rowHeader}</th>
              <th scope="col">{unit}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
