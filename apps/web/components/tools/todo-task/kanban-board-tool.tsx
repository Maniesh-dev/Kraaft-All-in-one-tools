"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { CaretLeft, CaretRight, Plus, Trash, Kanban } from "@phosphor-icons/react"
import { Label } from "@workspace/ui/components/label"

type ColumnStatus = "todo" | "in-progress" | "done"

interface KanbanTask {
  id: string
  text: string
  status: ColumnStatus
}

const COLUMNS: { id: ColumnStatus, title: string, color: string }[] = [
  { id: "todo", title: "To Do", color: "border-l-4 border-l-slate-400" },
  { id: "in-progress", title: "In Progress", color: "border-l-4 border-l-blue-500" },
  { id: "done", title: "Done", color: "border-l-4 border-l-green-500" }
]

export function KanbanBoardTool() {
  const [tasks, setTasks] = React.useState<KanbanTask[]>([])
  const [input, setInput] = React.useState("")
  const [isLoaded, setIsLoaded] = React.useState(false)

  React.useEffect(() => {
    const saved = localStorage.getItem("allinone_kanban_board")
    if (saved) {
      try {
        setTasks(JSON.parse(saved))
      } catch {}
    }
    setIsLoaded(true)
  }, [])

  React.useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("allinone_kanban_board", JSON.stringify(tasks))
    }
  }, [tasks, isLoaded])

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    setTasks([
      ...tasks,
      { id: crypto.randomUUID(), text: input.trim(), status: "todo" }
    ])
    setInput("")
  }

  const shiftTask = (id: string, direction: "left" | "right") => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const colIndex = COLUMNS.findIndex(c => c.id === t.status)
        const newIndex = direction === "right" ? colIndex + 1 : colIndex - 1
        return { ...t, status: COLUMNS[newIndex]?.id ?? t.status }
      }
      return t
    }))
  }

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id))
  }

  const clearDone = () => {
    setTasks(tasks.filter(t => t.status !== "done"))
  }

  if (!isLoaded) return null

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Kanban className="text-primary" /> Kanban Board
            </CardTitle>
            <CardDescription>A simple project board to track tasks.</CardDescription>
          </div>
          {tasks.some(t => t.status === "done") && (
             <Button variant="outline" onClick={clearDone} size="sm">
               Clear Done
             </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleAdd} className="flex gap-2 max-w-lg">
            <Input 
              placeholder="New task..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={!input.trim()}>
              <Plus data-icon="inline-start" /> Add to "To Do"
            </Button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
             {COLUMNS.map((col, colIndex) => {
               const colTasks = tasks.filter(t => t.status === col.id)
               
               return (
                 <div key={col.id} className="flex flex-col bg-muted/30 rounded-xl p-4 gap-3 min-h-[400px]">
                   <div className="flex items-center justify-between mb-2">
                     <h3 className="font-semibold">{col.title}</h3>
                     <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full font-bold">
                       {colTasks.length}
                     </span>
                   </div>
                   
                   {colTasks.map(task => (
                     <Card key={task.id} className={`shadow-sm ${col.color}`}>
                       <CardContent className="p-3 text-sm flex flex-col gap-3">
                         <p className="font-medium break-words leading-tight">{task.text}</p>
                         
                         <div className="flex items-center justify-between mt-auto">
                            <Button 
                              variant="ghost" 
                              size="icon-sm" 
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={() => shiftTask(task.id, "left")}
                              disabled={colIndex === 0}
                            >
                              <CaretLeft />
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="icon-sm" 
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => removeTask(task.id)}
                            >
                              <Trash className="size-3" />
                            </Button>

                            <Button 
                              variant="ghost" 
                              size="icon-sm" 
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={() => shiftTask(task.id, "right")}
                              disabled={colIndex === COLUMNS.length - 1}
                            >
                              <CaretRight />
                            </Button>
                         </div>
                       </CardContent>
                     </Card>
                   ))}

                   {colTasks.length === 0 && (
                     <div className="flex-1 border-2 border-dashed border-muted flex items-center justify-center rounded-lg opacity-50">
                       <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Empty</span>
                     </div>
                   )}
                 </div>
               )
             })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
