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

/** Under this, a call is "due". */
const DUE_SECONDS = 60
/** Under this, "due" flashes. */
const FLASH_SECONDS = 30

/** Time left before the call, in whole minutes; clock time from an hour out. */
function waitLabel(seconds: number, at: number) {
  if (seconds < DUE_SECONDS) return "due"
  if (seconds >= 3600) return formatTime(at)
  return `${Math.floor(seconds / 60)} min`
}

function Eta({ departure, now }: { departure: Departure; now: number }) {
  if (departure.passed) {
    return <span className="font-medium whitespace-nowrap text-muted-foreground">passed</span>
  }
  const realtime = departure.expected !== null
  const seconds = secondsUntil(departure.effective, now)
  const minutes = Math.floor(seconds / 60)
  // Flips every second, in step with `now`.
  const dimmed = seconds < FLASH_SECONDS && Math.floor(now / 1000) % 2 === 1
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium whitespace-nowrap tabular-nums",
        minutes === 1 && "text-primary",
        minutes > 15 && "text-muted-foreground font-normal",
      )}
    >
      {realtime && (
        <RadioIcon
          className="size-3.5 animate-pulse text-emerald-600 dark:text-emerald-400"
          aria-label="Realtime"
        />
      )}
      <span className={cn(dimmed && "text-foreground/20 motion-reduce:text-inherit")}>
        {waitLabel(seconds, departure.effective)}
      </span>
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
          <li key={d.key}>
            <Card className={cn("gap-2 px-4 py-3", d.passed && "opacity-60")}>
              <div className="leading-snug font-medium">{d.dto.destination ?? "Unknown"}</div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xl">
                  <Eta departure={d} now={now} />
                </span>
                <StatusBadge status={d.status} />
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
              <TableRow key={d.key} className={cn(d.passed && "opacity-60")}>
                <TableCell className="pl-4">
                  <Eta departure={d} now={now} />
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
                  <StatusBadge status={d.status} />
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
