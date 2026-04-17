"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Label } from "@workspace/ui/components/label"

export function TimeElapsedTool() {
  // ISO string for datetime-local input
  const [targetDateStr, setTargetDateStr] = React.useState("")
  const [elapsed, setElapsed] = React.useState({
    totalSeconds: 0,
    years: 0,
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isFuture: false
  })

  React.useEffect(() => {
    // Initial preset to an hour ago
    const d = new Date()
    d.setHours(d.getHours() - 1)
    
    // format as YYYY-MM-DDThh:mm
    const tzOffset = d.getTimezoneOffset() * 60000
    const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0,16)
    setTargetDateStr(localISOTime)
  }, [])

  React.useEffect(() => {
    if (!targetDateStr) return

    const timer = setInterval(() => {
      const target = new Date(targetDateStr).getTime()
      const now = new Date().getTime()
      
      const diffMs = target - now
      const isFut = diffMs > 0
      const totalSeconds = Math.floor(Math.abs(diffMs) / 1000)

      let remaining = totalSeconds

      const y = Math.floor(remaining / (365 * 24 * 3600))
      remaining %= (365 * 24 * 3600)

      const m = Math.floor(remaining / (30.44 * 24 * 3600))
      remaining %= Math.floor(30.44 * 24 * 3600)

      const d = Math.floor(remaining / (24 * 3600))
      remaining %= (24 * 3600)

      const h = Math.floor(remaining / 3600)
      remaining %= 3600

      const mins = Math.floor(remaining / 60)
      const s = remaining % 60

      setElapsed({
        totalSeconds,
        years: y,
        months: m,
        days: d,
        hours: h,
        minutes: mins,
        seconds: s,
        isFuture: isFut
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDateStr])

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Time Elapsed / Countdown</CardTitle>
          <CardDescription>Enter a date and time to see the exact duration elapsed or remaining.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="space-y-4">
             <div className="space-y-1.5">
               <Label>Target Date & Time</Label>
               <input 
                 type="datetime-local" 
                 className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                 value={targetDateStr}
                 onChange={(e) => setTargetDateStr(e.target.value)}
               />
             </div>
           </div>
        </CardContent>
      </Card>

      {targetDateStr && (
        <Card className={`border-t-4 ${elapsed.isFuture ? 'border-t-indigo-500' : 'border-t-primary'}`}>
          <CardContent className="pt-8">
            <div className="text-center mb-8">
               <h2 className="text-2xl font-semibold tracking-tight">
                 {elapsed.isFuture ? "Time Remaining Until" : "Time Elapsed Since"}
               </h2>
               <p className="text-muted-foreground mt-2 font-medium">
                 {new Date(targetDateStr).toLocaleString(undefined, { 
                   weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                 })}
               </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 text-center">
              {[
                { label: 'Years', value: elapsed.years },
                { label: 'Months', value: elapsed.months },
                { label: 'Days', value: elapsed.days },
                { label: 'Hours', value: elapsed.hours },
                { label: 'Minutes', value: elapsed.minutes },
                { label: 'Seconds', value: elapsed.seconds },
              ].map((unit) => (
                <div key={unit.label} className="bg-muted/40 rounded-xl p-3 flex flex-col items-center justify-center border border-border/50 shadow-sm">
                  <span className="text-3xl font-bold font-mono tracking-tighter text-foreground mb-1">
                    {unit.value}
                  </span>
                  <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                    {unit.label}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t text-center">
               <p className="text-sm font-medium text-muted-foreground">Total Time</p>
               <p className="text-xl font-mono mt-1">
                 {elapsed.totalSeconds.toLocaleString()} seconds
               </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
