"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { X, Plus, Clock } from "@phosphor-icons/react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Separator } from "@workspace/ui/components/separator"
import { Label } from "@workspace/ui/components/label"

const PRESET_TIMEZONES = [
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Australia/Sydney",
  "UTC"
]

export function WorldClockTool() {
  const [timezones, setTimezones] = React.useState<string[]>([])
  const [availableTimezones, setAvailableTimezones] = React.useState<string[]>([])
  const [selectedTz, setSelectedTz] = React.useState<string>("UTC")
  const [now, setNow] = React.useState(new Date())

  React.useEffect(() => {
    // Get all supported timezones from the browser
    try {
      const allTzs = Intl.supportedValuesOf('timeZone')
      setAvailableTimezones(allTzs)
    } catch {
      setAvailableTimezones(PRESET_TIMEZONES)
    }
    
    // Add local timezone by default if list is empty
    const local = Intl.DateTimeFormat().resolvedOptions().timeZone
    setTimezones(prev => prev.length === 0 ? [local] : prev)

    // Update time every second
    const timer = setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const addTimezone = () => {
    if (!timezones.includes(selectedTz)) {
      setTimezones([...timezones, selectedTz])
    }
  }

  const removeTimezone = (tzToRemove: string) => {
    setTimezones(timezones.filter(tz => tz !== tzToRemove))
  }

  const formatTime = (date: Date, tz: string) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date)
  }

  const formatDate = (date: Date, tz: string) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Add Timezone</CardTitle>
          <CardDescription>Select a timezone to add it to your world clock.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-1 space-y-1.5">
              <Label>Search Timezone</Label>
              <Select value={selectedTz} onValueChange={setSelectedTz}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone..." />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectGroup>
                    {availableTimezones.map(tz => (
                      <SelectItem key={tz} value={tz}>
                        {tz.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addTimezone}>
              <Plus data-icon="inline-start" /> Add Clock
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {timezones.map(tz => (
          <Card key={tz} className="relative overflow-hidden group transition-all duration-200 hover:border-primary/50">
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => removeTimezone(tz)}
            >
              <X />
              <span className="sr-only">Remove</span>
            </Button>
            <CardHeader className="pb-2">
              <CardDescription className="text-sm font-medium tracking-tight truncate pr-6 text-primary">
                {tz.split('/').pop()?.replace(/_/g, ' ')}
              </CardDescription>
              <p className="text-xs text-muted-foreground truncate">{tz}</p>
            </CardHeader>
            <CardContent>
               <div className="flex flex-col gap-1">
                 <div className="text-3xl font-bold font-mono tracking-tighter">
                   {formatTime(now, tz)}
                 </div>
                 <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                   {formatDate(now, tz)}
                 </div>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {timezones.length === 0 && (
         <div className="text-center py-24 text-muted-foreground flex flex-col items-center justify-center gap-4">
           <Clock className="size-12 opacity-20" />
           <p>No timezones added.</p>
         </div>
      )}
    </div>
  )
}
