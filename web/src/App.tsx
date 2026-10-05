import { useMemo, useState } from "react"
import { AlertCircleIcon, BusFrontIcon, RefreshCwIcon } from "lucide-react"

import { api, StopNotServedError, usingMock } from "@/api"
import { Departures } from "@/components/departures"
import { StopPicker } from "@/components/stop-picker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useNow } from "@/hooks/use-now"
import { usePolling } from "@/hooks/use-polling"
import { useSelectedStop } from "@/hooks/use-selected-stop"
import { upcomingDepartures } from "@/lib/departures"
import { formatClock } from "@/lib/time"
import { cn } from "@/lib/utils"

const REFRESH_INTERVAL_MS = 5_000
const STOPS_REFRESH_INTERVAL_MS = 30 * 60_000
const PAGE_SIZE = 12

const servedToday = () => api.servedToday()

export default function App() {
  const now = useNow(1000)
  const [stop, setStop] = useSelectedStop()
  const stops = usePolling("served_today", servedToday, STOPS_REFRESH_INTERVAL_MS)
  const times = usePolling(stop, api.stopTimes, REFRESH_INTERVAL_MS)
  const [shown, setShown] = useState(PAGE_SIZE)

  const sortedStops = useMemo(
    () => stops.data?.toSorted((a, b) => a.localeCompare(b, "fr")),
    [stops.data],
  )
  const departures = useMemo(
    () => (times.data ? upcomingDepartures(times.data, now) : []),
    [times.data, now],
  )

  const selectStop = (next: string) => {
    setShown(PAGE_SIZE)
    setStop(next)
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <BusFrontIcon className="size-5" />
          </div>
          <div>
            <h1 className="font-heading text-xl leading-tight font-semibold">Morningstar</h1>
            <p className="text-sm text-muted-foreground">Next buses at your stop</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <time className="text-lg font-medium tabular-nums sm:text-2xl">{formatClock(now)}</time>
          {usingMock && (
            <Badge variant="outline" className="text-muted-foreground">
              mock data
            </Badge>
          )}
        </div>
      </header>

      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StopPicker stops={sortedStops} value={stop} onChange={selectStop} />
        {stop && (
          <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground sm:justify-end">
            <span className="flex items-center gap-2" aria-live="polite">
              <span
                className={cn(
                  "size-2 rounded-full",
                  times.error ? "bg-destructive" : "bg-emerald-500",
                  times.fetching && "animate-pulse",
                )}
              />
              {times.fetching
                ? "Updating…"
                : times.updatedAt
                  ? `Updated ${Math.max(0, Math.round((now - times.updatedAt) / 1000))}s ago`
                  : ""}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={times.refresh}
              disabled={times.fetching}
              aria-label="Refresh"
            >
              <RefreshCwIcon className={cn(times.fetching && "animate-spin")} />
            </Button>
          </div>
        )}
      </section>

      {stops.error && !stops.data && (
        <Notice tone="error" title="Could not load stops" detail={stops.error.message} />
      )}

      <main className="flex flex-col gap-3">
        {!stop ? (
          <Notice title="Pick a stop" detail="Choose a bus stop above to see its next calls." />
        ) : times.error && !times.data ? (
          times.error instanceof StopNotServedError ? (
            <Notice title="Stop not served today" detail={times.error.message} />
          ) : (
            <Notice tone="error" title="Could not load departures" detail={times.error.message} />
          )
        ) : !times.data ? (
          <LoadingList />
        ) : departures.length === 0 ? (
          <Notice title="No more departures today" detail="Check back tomorrow morning." />
        ) : (
          <>
            {times.error && (
              <Notice
                tone="error"
                title="Refresh failed, showing last known data"
                detail={times.error.message}
              />
            )}
            <Departures departures={departures.slice(0, shown)} now={now} />
            {departures.length > shown && (
              <Button
                variant="outline"
                className="self-center"
                onClick={() => setShown((n) => n + PAGE_SIZE)}
              >
                Show more ({departures.length - shown} left today)
              </Button>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function Notice({
  title,
  detail,
  tone,
}: {
  title: string
  detail?: string
  tone?: "error"
}) {
  return (
    <Card
      className={cn(
        "flex-row items-start gap-3 px-4 py-4",
        tone === "error" && "border-destructive/40 text-destructive",
      )}
    >
      {tone === "error" && <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />}
      <div>
        <p className="font-medium">{title}</p>
        {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
      </div>
    </Card>
  )
}

function LoadingList() {
  return (
    <div className="flex flex-col gap-2" aria-busy>
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl md:h-11" />
      ))}
    </div>
  )
}
