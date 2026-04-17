"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { X, Plus, CalendarBlank } from "@phosphor-icons/react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
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
  "Australia/Sydney",
  "UTC"
]

export function TimezonePlannerTool() {
  const [timezones, setTimezones] = React.useState<string[]>([])
  const [availableTimezones, setAvailableTimezones] = React.useState<string[]>([])
  const [selectedTz, setSelectedTz] = React.useState<string>("UTC")
  
  // Base time in UTC (today at midnight)
  const [baseDate, setBaseDate] = React.useState<Date>(() => {
    const d = new Date()
    d.setUTCHours(12, 0, 0, 0)
    return d
  })
  
  // Slider value is offset in hours from baseDate (-12 to +12)
  const [hourOffset, setHourOffset] = React.useState<number>(0)

  React.useEffect(() => {
    try {
      const allTzs = Intl.supportedValuesOf('timeZone')
      setAvailableTimezones(allTzs)
    } catch {
      setAvailableTimezones(PRESET_TIMEZONES)
    }
    
    const local = Intl.DateTimeFormat().resolvedOptions().timeZone
    const initialTzs = [local]
    if (local !== 'UTC') initialTzs.push('UTC')
    setTimezones(initialTzs)
  }, [])

  const addTimezone = () => {
    if (!timezones.includes(selectedTz)) {
      setTimezones([...timezones, selectedTz])
    }
  }

  const removeTimezone = (tzToRemove: string) => {
    setTimezones(timezones.filter(tz => tz !== tzToRemove))
  }

  const getTargetDate = () => {
    const target = new Date(baseDate.getTime())
    target.setUTCHours(baseDate.getUTCHours() + hourOffset)
    return target
  }

  const formatTime = (date: Date, tz: string) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date)
  }

  const formatDate = (date: Date, tz: string) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date)
  }
  
  const getOffsetFromLocal = (tz: string) => {
    const targetDate = getTargetDate()
    
    // Get timezone offset string like "GMT+5:30"
    const tzStr = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset'
    }).format(targetDate)
    
    // Usually formatted as "MM/DD/YYYY, GMT+5:30" - extract the offset
    const match = tzStr.match(/GMT([+-].+)/)
    if (match) return match[1]
    return "+0"
  }

  const targetDate = getTargetDate()

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Plan Meeting Time</CardTitle>
          <CardDescription>Slide to adjust the time across all selected locations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground font-medium">
              <span>-12 Hours</span>
              <span className="text-foreground">Base Time (UTC)</span>
              <span>+12 Hours</span>
            </div>
            <input 
              type="range" 
              min="-12" 
              max="12" 
              step="0.5" 
              value={hourOffset} 
              onChange={(e) => setHourOffset(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-center mt-2">
              <Button variant="outline" size="sm" onClick={() => setHourOffset(0)}>
                Reset to Default
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-end gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex-1 space-y-1.5">
              <Label>Add Location</Label>
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
              <Plus data-icon="inline-start" /> Add Location
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {timezones.map(tz => (
          <Card key={tz} className="relative overflow-hidden flex items-center justify-between p-4 group">
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => removeTimezone(tz)}
            >
              <X />
              <span className="sr-only">Remove</span>
            </Button>
            
            <div className="flex flex-col gap-1 pr-6">
              <h3 className="font-semibold text-lg">{tz.split('/').pop()?.replace(/_/g, ' ')}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <CalendarBlank className="size-3" />
                {formatDate(targetDate, tz)}
              </p>
              <p className="text-xs font-mono bg-secondary w-fit px-1.5 py-0.5 rounded text-secondary-foreground mt-1">
                UTC{getOffsetFromLocal(tz)}
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold font-mono tracking-tighter text-primary">
                {formatTime(targetDate, tz)}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
