"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Input } from "@workspace/ui/components/input"
import { GlobeHemisphereWest, Plus, Trash } from "@phosphor-icons/react"
import { Button } from "@workspace/ui/components/button"

function getTimezones() {
  try {
    return Intl.supportedValuesOf('timeZone')
  } catch (e) {
    return [
      "UTC", "America/New_York", "America/Los_Angeles", "America/Chicago", 
      "Europe/London", "Europe/Paris", "Asia/Tokyo", "Asia/Kolkata", 
      "Australia/Sydney"
    ]
  }
}

// Parses a local date input (YYYY-MM-DDTHH:mm) assuming it's in the given timezone,
// then returns a core UTC Date object we can format to other timezones natively.
function createDateInTimezone(localString: string, timeZone: string): Date {
  // Hacky but robust native way: we guess the offset and adjust the UTC time
  const date = new Date(localString);
  if (isNaN(date.getTime())) return new Date();
  
  // Find offset of this timezone at the target date
  const tzString = date.toLocaleString("en-US", { timeZone, timeZoneName: "shortOffset" });
  const offsetMatch = tzString.match(/GMT([+-]\d{1,2}(?::\d{2})?)/);
  
  let offsetHours = 0;
  let offsetMinutes = 0;
  
  if (offsetMatch && offsetMatch[1]) {
    const parts = offsetMatch[1].split(':');
    offsetHours = parseInt(parts[0] || "0", 10);
    if (parts[1]) {
       offsetMinutes = parseInt(parts[1], 10);
       if (offsetHours < 0) offsetMinutes = -offsetMinutes;
    }
  }

  // Adjust the local time by the offset difference to get the true UTC date
  const utcMillis = date.getTime() - ((offsetHours * 60 + offsetMinutes) * 60 * 1000) + (date.getTimezoneOffset() * 60 * 1000);
  return new Date(utcMillis);
}

export function TimezoneConverterTool() {
  const [timezones] = React.useState<string[]>(getTimezones())
  
  // Base configuration
  const [baseTimezone, setBaseTimezone] = React.useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC")
  const [baseDatetime, setBaseDatetime] = React.useState<string>(() => {
     const tzOffset = (new Date()).getTimezoneOffset() * 60000;
     const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 16);
     return localISOTime;
  })

  // Target timezone comparative list
  const [targets, setTargets] = React.useState<string[]>(["UTC"])

  const addTarget = (tz: string) => {
    if (!targets.includes(tz)) {
       setTargets([...targets, tz])
    }
  }

  const removeTarget = (tz: string) => {
    setTargets(targets.filter(t => t !== tz))
  }

  const baseDate = React.useMemo(() => {
     return createDateInTimezone(baseDatetime, baseTimezone)
  }, [baseDatetime, baseTimezone])

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GlobeHemisphereWest className="text-primary" /> Timezone Converter
          </CardTitle>
          <CardDescription>Convert specific dates and times between global timezones effortlessly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 shadow-sm space-y-4">
             <h3 className="font-semibold px-1 text-sm tracking-wide">Base Datetime & Timezone</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                   type="datetime-local" 
                   value={baseDatetime}
                   onChange={(e) => setBaseDatetime(e.target.value)}
                   className="h-12 bg-card"
                />
                <Select value={baseTimezone} onValueChange={setBaseTimezone}>
                   <SelectTrigger className="h-12 bg-card">
                      <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                      {timezones.map(tz => <SelectItem key={`base-${tz}`} value={tz}>{tz.replace(/_/g, ' ')}</SelectItem>)}
                   </SelectContent>
                </Select>
             </div>
             <p className="text-xs text-muted-foreground pt-2 px-1">
               This is the anchor time. Changing this natively updates all calculated timezones below.
             </p>
          </div>

          <div className="space-y-4">
             <div className="flex justify-between items-center px-1">
                <h3 className="font-semibold text-sm tracking-wide">Target Timezones</h3>
                <div className="w-[200px]">
                   <Select onValueChange={addTarget}>
                      <SelectTrigger className="h-9 text-xs font-semibold bg-muted hover:bg-muted/80 w-full transition-colors">
                         <Plus weight="bold" className="mr-1" /> Add Timezone
                      </SelectTrigger>
                      <SelectContent>
                         {timezones.filter(tz => !targets.includes(tz) && tz !== baseTimezone).map(tz => (
                            <SelectItem key={`tg-${tz}`} value={tz}>{tz.replace(/_/g, ' ')}</SelectItem>
                         ))}
                      </SelectContent>
                   </Select>
                </div>
             </div>

             <div className="grid grid-cols-1 gap-3">
                {targets.length === 0 && (
                   <div className="text-center p-8 bg-muted/20 border border-dashed rounded-lg text-sm text-muted-foreground">
                      No target timezones added. Select one above.
                   </div>
                )}
                {targets.map(target => {
                   const localStr = baseDate.toLocaleString("en-US", { timeZone: target, weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZoneName: 'short' });
                   
                   return (
                     <div key={target} className="flex items-center justify-between p-4 border rounded-xl bg-card shadow-sm group">
                        <div className="flex flex-col md:flex-row gap-1 md:items-center">
                           <span className="font-bold w-[180px] truncate text-sm" title={target}>
                             {target.split('/').pop()?.replace(/_/g, ' ')}
                           </span>
                           <span className="text-sm md:text-base font-semibold md:ml-4 text-primary">
                             {localStr}
                           </span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeTarget(target)} className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10">
                           <Trash />
                        </Button>
                     </div>
                   )
                })}
             </div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
