import type { ReactNode } from "react"
import { RadioIcon } from "lucide-react"

import { StatusBadge } from "@/components/status-badge"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Departure } from "@/lib/departures"
import { formatClock, formatTime, secondsUntil } from "@/lib/time"
import { cn } from "@/lib/utils"

/**
 * Time left before the call: to the second for realtime calls ("4m 07s"),
 * to the minute for scheduled ones ("4 min").
 */
function waitLabel(seconds: number, at: number, realtime: boolean) {
  if (seconds <= 0) return "now"
  if (seconds >= 3600) return realtime ? formatClock(at) : formatTime(at)
  const minutes = Math.floor(seconds / 60)
  if (!realtime) return `${minutes} min`
  const rest = String(seconds % 60).padStart(2, "0")
  return minutes === 0 ? `${seconds}s` : `${minutes}m ${rest}s`
}

function Eta({ at, now, realtime }: { at: number; now: number; realtime: boolean }) {
  const seconds = secondsUntil(at, now)
  const minutes = Math.floor(seconds / 60)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium whitespace-nowrap tabular-nums",
        minutes <= 1 && "text-primary",
        minutes > 15 && "text-muted-foreground font-normal",
      )}
    >
      {realtime && (
        <RadioIcon
          className="size-3.5 animate-pulse text-emerald-600 dark:text-emerald-400"
          aria-label="Realtime"
        />
      )}
      {waitLabel(seconds, at, realtime)}
    </span>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

interface DeparturesProps {
  departures: Departure[]
  now: number
}

/** Card list on small screens, table from `md` up. */
export function Departures({ departures, now }: DeparturesProps) {
  return (
    <>
      <ul className="flex flex-col gap-2 md:hidden">
        {departures.map((d) => (
          <li key={d.dto.aimed_arrival + d.dto.destination}>
            <Card className="gap-2 px-4 py-3">
              <div className="leading-snug font-medium">{d.dto.destination ?? "Unknown"}</div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xl">
                  <Eta at={d.effective} now={now} realtime={d.expected !== null} />
                </span>
                <StatusBadge status={d.dto.status} />
              </div>
              <dl className="grid grid-cols-3 gap-x-3 border-t pt-2 text-sm">
                <Field label="Scheduled">
                  <span className={cn("tabular-nums", d.expected !== null && "text-muted-foreground")}>
                    {formatTime(d.aimed)}
                  </span>
                </Field>
                <Field label="Realtime">
                  {d.expected !== null ? (
                    <span className="font-medium tabular-nums">{formatClock(d.expected)}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </Field>
                <Field label="Stops">
                  <span className="tabular-nums">{d.dto.stops_to_destination ?? "—"}</span>
                </Field>
              </dl>
            </Card>
          </li>
        ))}
      </ul>

      <Card className="hidden py-0 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Departs in</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Realtime</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-4 text-right">Stops to dest.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departures.map((d) => (
              <TableRow key={d.dto.aimed_arrival + d.dto.destination}>
                <TableCell className="pl-4">
                  <Eta at={d.effective} now={now} realtime={d.expected !== null} />
                </TableCell>
                <TableCell className="font-medium">{d.dto.destination ?? "Unknown"}</TableCell>
                <TableCell
                  className={cn(
                    "tabular-nums",
                    d.expected !== null && "text-muted-foreground",
                  )}
                >
                  {formatTime(d.aimed)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {d.expected !== null ? (
                    <span className="font-medium">{formatClock(d.expected)}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={d.dto.status} />
                </TableCell>
                <TableCell className="pr-4 text-right tabular-nums">
                  {d.dto.stops_to_destination ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}
