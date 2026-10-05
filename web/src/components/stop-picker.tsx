import { useState } from "react"
import { ChevronsUpDownIcon, MapPinIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface StopPickerProps {
  stops: string[] | undefined
  value: string | null
  onChange: (stop: string) => void
}

/** Searchable stop selector. */
export function StopPicker({ stops, value, onChange }: StopPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="lg"
            role="combobox"
            aria-expanded={open}
            disabled={!stops}
            className="h-11 w-full justify-between px-3 text-base sm:w-96"
          />
        }
      >
        <span className="flex min-w-0 items-center gap-2">
          <MapPinIcon className="text-muted-foreground" />
          <span className="truncate">
            {value ?? (stops ? "Select a stop…" : "Loading stops…")}
          </span>
        </span>
        <ChevronsUpDownIcon className="text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--anchor-width) min-w-72 p-0">
        <Command>
          <CommandInput placeholder="Search stops…" />
          <CommandList className="max-h-[min(60vh,20rem)]">
            <CommandEmpty>No stop found.</CommandEmpty>
            <CommandGroup>
              {stops?.map((stop) => (
                <CommandItem
                  key={stop}
                  value={stop}
                  data-checked={stop === value}
                  onSelect={() => {
                    onChange(stop)
                    setOpen(false)
                  }}
                >
                  {stop}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
