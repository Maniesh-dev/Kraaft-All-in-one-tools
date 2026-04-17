"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Plus, Trash, CheckCircle, Circle, Repeat } from "@phosphor-icons/react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"

type ResetPeriod = "daily" | "weekly"

interface RecurringTask {
  id: string
  text: string
  period: ResetPeriod
  completedDate: string | null // ISO Date string of last completion
}

const getTodayDateString = () => new Date().toISOString().split('T')[0]

// Check if a date string is from a previous week. Simple check: Diff > 6 days or different week number.
const isPreviousWeek = (dateStr: string) => {
  const compDate = new Date(dateStr)
  const today = new Date()
  
  // Reset at Monday logic (simplification: if difference in days from last completion is > days since Monday)
  const todayDay = today.getDay() === 0 ? 7 : today.getDay() // 1 = Monday ... 7 = Sunday
  
  // Set to midnight
  today.setHours(0,0,0,0)
  compDate.setHours(0,0,0,0)
  
  const diffTime = Math.abs(today.getTime() - compDate.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays >= todayDay || diffDays >= 7
}

export function RecurringTaskTool() {
  const [tasks, setTasks] = React.useState<RecurringTask[]>([])
  const [input, setInput] = React.useState("")
  const [period, setPeriod] = React.useState<ResetPeriod>("daily")
  const [isLoaded, setIsLoaded] = React.useState(false)

  React.useEffect(() => {
    const saved = localStorage.getItem("allinone_recurring_tasks")
    if (saved) {
      try {
        const parsed: RecurringTask[] = JSON.parse(saved)
        const todayStr = getTodayDateString()
        
        // Auto-reset logic
        const updatedTasks = parsed.map(task => {
          if (!task.completedDate) return task
          
          let shouldReset = false
          if (task.period === "daily" && task.completedDate !== todayStr) {
            shouldReset = true
          } else if (task.period === "weekly" && task.completedDate !== todayStr) {
            shouldReset = isPreviousWeek(task.completedDate)
          }
          
          return shouldReset ? { ...task, completedDate: null } : task
        })
        
        setTasks(updatedTasks)
      } catch {}
    }
    setIsLoaded(true)
  }, [])

  React.useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("allinone_recurring_tasks", JSON.stringify(tasks))
    }
  }, [tasks, isLoaded])

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setTasks([
      ...tasks,
      {
        id: crypto.randomUUID(),
        text: input.trim(),
        period,
        completedDate: null
      }
    ])
    setInput("")
  }

  const toggleComplete = (id: string) => {
    const todayStr = getTodayDateString()
    setTasks(tasks.map(t => {
      if (t.id === id) {
        return { ...t, completedDate: t.completedDate ? null : todayStr } as RecurringTask
      }
      return t
    }))
  }

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id))
  }

  if (!isLoaded) return null

  const dailyTasks = tasks.filter(t => t.period === "daily")
  const weeklyTasks = tasks.filter(t => t.period === "weekly")

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="text-primary" /> Habit & Tracking Routines
          </CardTitle>
          <CardDescription>Tasks that reset automatically so you can build routines.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input 
              placeholder="E.g. Drink water, Read 10 pages..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1"
            />
            <Select value={period} onValueChange={(val: ResetPeriod) => setPeriod(val)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={!input.trim()}>
              <Plus data-icon="inline-start" /> Add
            </Button>
          </form>

          {tasks.length === 0 && (
             <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/20 text-muted-foreground">
               <p>No recurring tasks defined.</p>
               <p className="text-sm mt-1">Add your daily habits to track them here!</p>
             </div>
          )}

          {dailyTasks.length > 0 && (
            <div className="space-y-3">
               <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest pl-1">Daily Resets</h3>
               <ul className="space-y-2">
                  {dailyTasks.map(task => {
                    const isDone = !!task.completedDate
                    return (
                      <li key={task.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isDone ? 'bg-green-500/10 border-green-500/20' : 'bg-card'}`}>
                         <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleComplete(task.id)}>
                            {isDone ? <CheckCircle className="size-6 text-green-600" weight="fill" /> : <Circle className="size-6 text-muted-foreground" />}
                            <span className={`font-medium ${isDone ? 'text-green-700 dark:text-green-500' : ''}`}>{task.text}</span>
                         </div>
                         <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeTask(task.id)}>
                           <Trash />
                         </Button>
                      </li>
                    )
                  })}
               </ul>
            </div>
          )}

          {weeklyTasks.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
               <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest pl-1">Weekly Resets</h3>
               <ul className="space-y-2">
                  {weeklyTasks.map(task => {
                    const isDone = !!task.completedDate
                    return (
                      <li key={task.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isDone ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-card'}`}>
                         <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleComplete(task.id)}>
                            {isDone ? <CheckCircle className="size-6 text-indigo-600" weight="fill" /> : <Circle className="size-6 text-muted-foreground" />}
                            <span className={`font-medium ${isDone ? 'text-indigo-700 dark:text-indigo-500' : ''}`}>{task.text}</span>
                         </div>
                         <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeTask(task.id)}>
                           <Trash />
                         </Button>
                      </li>
                    )
                  })}
               </ul>
            </div>
          )}

        </CardContent>
      </Card>
      
      <div className="text-center text-xs text-muted-foreground p-4">
        Your progress is safely stored on this browser device. Routines reset automatically.
      </div>
    </div>
  )
}
