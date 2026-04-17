"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Plus, Trash, CheckSquare, Square, GridFour } from "@phosphor-icons/react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"

type MatrixQuadrant = "q1" | "q2" | "q3" | "q4"

interface MatrixTask {
  id: string
  text: string
  quadrant: MatrixQuadrant
  done: boolean
}

const QUADRANTS: { id: MatrixQuadrant, title: string, desc: string, bg: string, border: string }[] = [
  { id: "q1", title: "Do First", desc: "Urgent & Important", bg: "bg-red-500/10", border: "border-red-500/30" },
  { id: "q2", title: "Schedule", desc: "Not Urgent & Important", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  { id: "q3", title: "Delegate", desc: "Urgent & Not Important", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  { id: "q4", title: "Don't Do", desc: "Not Urgent & Not Important", bg: "bg-slate-500/10", border: "border-slate-500/30" }
]

export function PriorityMatrixTool() {
  const [tasks, setTasks] = React.useState<MatrixTask[]>([])
  const [input, setInput] = React.useState("")
  const [selectedQuad, setSelectedQuad] = React.useState<MatrixQuadrant>("q1")
  const [isLoaded, setIsLoaded] = React.useState(false)

  React.useEffect(() => {
    const saved = localStorage.getItem("allinone_priority_matrix")
    if (saved) {
      try {
        setTasks(JSON.parse(saved))
      } catch {}
    }
    setIsLoaded(true)
  }, [])

  React.useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("allinone_priority_matrix", JSON.stringify(tasks))
    }
  }, [tasks, isLoaded])

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setTasks([
      ...tasks,
      { id: crypto.randomUUID(), text: input.trim(), quadrant: selectedQuad, done: false }
    ])
    setInput("")
  }

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id))
  }

  const clearChecked = () => {
    setTasks(tasks.filter(t => !t.done))
  }

  if (!isLoaded) return null

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GridFour className="text-primary" /> Eisenhower Matrix
            </CardTitle>
            <CardDescription>Sort your tasks by Urgency and Importance.</CardDescription>
          </div>
          {tasks.some(t => t.done) && (
             <Button variant="outline" onClick={clearChecked} size="sm">
               Remove Checked
             </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
             <Input 
               placeholder="Enter a task..." 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               className="flex-1"
             />
             <div className="flex gap-2 w-full sm:w-auto">
               <Select value={selectedQuad} onValueChange={(v: MatrixQuadrant) => setSelectedQuad(v)}>
                 <SelectTrigger className="w-full sm:w-[220px]">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   {QUADRANTS.map(q => (
                     <SelectItem key={q.id} value={q.id}>
                       {q.title} ({q.desc})
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               <Button type="submit" disabled={!input.trim()}>
                 <Plus data-icon="inline-start" /> Add
               </Button>
             </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {QUADRANTS.map(quad => {
                const quadTasks = tasks.filter(t => t.quadrant === quad.id)
                return (
                  <div key={quad.id} className={`flex flex-col border rounded-xl overflow-hidden min-h-[250px] ${quad.border}`}>
                     <div className={`px-4 py-3 border-b border-inherit ${quad.bg}`}>
                        <h3 className="font-bold text-lg">{quad.title}</h3>
                        <p className="text-xs font-semibold uppercase tracking-wider opacity-60 m-0">{quad.desc}</p>
                     </div>
                     <div className="p-3 flex-1 bg-card/50">
                        <ul className="space-y-1">
                          {quadTasks.map(task => (
                             <li key={task.id} className={`flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors group ${task.done ? 'opacity-60' : ''}`}>
                                <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleTask(task.id)}>
                                   {task.done ? <CheckSquare className="size-4 shrink-0 text-primary" weight="fill" /> : <Square className="size-4 shrink-0 text-muted-foreground" />}
                                   <span className={`text-sm font-medium ${task.done ? 'line-through text-muted-foreground' : ''}`}>{task.text}</span>
                                </div>
                                <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100" onClick={() => removeTask(task.id)}>
                                  <Trash className="size-3" />
                                </Button>
                             </li>
                          ))}
                        </ul>
                        {quadTasks.length === 0 && (
                          <div className="h-full min-h-[100px] flex items-center justify-center opacity-40">
                             <span className="text-sm font-medium">No tasks</span>
                          </div>
                        )}
                     </div>
                  </div>
                )
             })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
