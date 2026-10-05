import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Tone = "on-time" | "early" | "late" | "very-late" | "other"

function tone(status: string): Tone {
  const s = status.toLowerCase()
  if (s.startsWith("on time")) return "on-time"
  if (s.startsWith("early")) return "early"
  if (s.startsWith("late")) return Number(/\d+/.exec(s)?.[0] ?? 0) >= 5 ? "very-late" : "late"
  return "other"
}

const textColor: Record<Tone, string> = {
  "on-time": "text-emerald-700 dark:text-emerald-400",
  early: "text-sky-700 dark:text-sky-400",
  late: "text-amber-700 dark:text-amber-400",
  "very-late": "text-red-700 dark:text-red-400",
  other: "text-muted-foreground",
}

const background: Record<Tone, string> = {
  "on-time": "bg-emerald-500/15",
  early: "bg-sky-500/15",
  late: "bg-amber-500/15",
  "very-late": "bg-red-500/15",
  other: "bg-muted",
}

/** Realtime status, or a neutral "scheduled" badge when there is none. */
export function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        scheduled
      </Badge>
    )
  }
  const t = tone(status)
  return <Badge className={cn(background[t], textColor[t])}>{status}</Badge>
}
