"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Trash } from "@phosphor-icons/react"
import { Label } from "@workspace/ui/components/label"

interface PlannerSlot {
  time: string
  task: string
}

const DEFAULT_HOURS = [
  "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
  "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM"
]

export function DailyPlannerTool() {
  const [slots, setSlots] = React.useState<PlannerSlot[]>([])
  const [isLoaded, setIsLoaded] = React.useState(false)

  // Load from local storage
  React.useEffect(() => {
    const saved = localStorage.getItem("allinone_daily_planner")
    if (saved) {
      try {
        setSlots(JSON.parse(saved))
      } catch {
        // format error
      }
    } else {
      setSlots(DEFAULT_HOURS.map(time => ({ time, task: "" })))
    }
    setIsLoaded(true)
  }, [])

  // Save to local storage
  React.useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("allinone_daily_planner", JSON.stringify(slots))
    }
  }, [slots, isLoaded])

  const handleUpdate = (index: number, value: string) => {
    const newSlots = [...slots]
    if (newSlots[index]) {
      newSlots[index].task = value
      setSlots(newSlots)
    }
  }

  const clearPlanner = () => {
    setSlots(slots.map(s => ({ ...s, task: "" })))
  }

  if (!isLoaded) return null

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Daily Planner</CardTitle>
            <CardDescription>Time-block your day to maximize productivity.</CardDescription>
          </div>
          <Button variant="outline" onClick={clearPlanner}>
            <Trash data-icon="inline-start" /> Clear All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
             {slots.map((slot, i) => (
               <div key={slot.time} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors">
                  <div className="w-24 shrink-0 font-mono text-sm font-semibold text-muted-foreground flex items-center">
                    {slot.time}
                  </div>
                  <div className="flex-1">
                    <Input 
                      placeholder="What are you doing?"
                      value={slot.task}
                      onChange={(e) => handleUpdate(i, e.target.value)}
                      className="border-none shadow-none bg-muted/50 focus-visible:bg-background"
                    />
                  </div>
               </div>
             ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
