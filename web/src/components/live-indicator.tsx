import type { PollingState } from "@/hooks/use-polling"
import { cn } from "@/lib/utils"

/** A request in flight for longer than this turns the indicator orange. */
const SLOW_MS = 3_000

type Health = "live" | "slow" | "down"

const dotColor: Record<Health, string> = {
  live: "bg-emerald-500",
  slow: "bg-amber-500",
  down: "bg-destructive",
}

const label: Record<Health, string> = {
  live: "Live",
  slow: "Slow connection",
  down: "Disconnected",
}

function health(state: PollingState<unknown>, now: number): Health {
  if (state.error) return "down"
  if (state.fetchingSince !== undefined && now - state.fetchingSince >= SLOW_MS) return "slow"
  return "live"
}

/**
 * Connection status: green, pulsing on every successful update; orange while a
 * request is slow; red after a failed one, until a request succeeds.
 */
export function LiveIndicator({ state, now }: { state: PollingState<unknown>; now: number }) {
  const h = health(state, now)
  const updated =
    state.updatedAt === undefined
      ? "Not updated yet"
      : `Updated ${Math.max(0, Math.round((now - state.updatedAt) / 1000))}s ago`
  return (
    <span className="flex items-center gap-2" title={updated}>
      <span className="relative flex size-2">
        {h === "live" && state.updatedAt !== undefined && (
          // Remounted on each update to replay the pulse.
          <span
            key={state.updatedAt}
            className="absolute inset-0 animate-live-pulse rounded-full bg-emerald-500 motion-reduce:hidden"
          />
        )}
        <span className={cn("relative size-2 rounded-full transition-colors", dotColor[h])} />
      </span>
      <span aria-live="polite">{label[h]}</span>
    </span>
  )
}
