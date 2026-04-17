"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Plus, Trash, CheckCircle, Circle } from "@phosphor-icons/react"

interface TodoItem {
  id: string
  text: string
  completed: boolean
}

export function TodoListTool() {
  const [todos, setTodos] = React.useState<TodoItem[]>([])
  const [inputValue, setInputValue] = React.useState("")
  const [isLoaded, setIsLoaded] = React.useState(false)

  // Load from local storage
  React.useEffect(() => {
    const saved = localStorage.getItem("allinone_todos")
    if (saved) {
      try {
        setTodos(JSON.parse(saved))
      } catch {
        // format error, start fresh
      }
    }
    setIsLoaded(true)
  }, [])

  // Save to local storage
  React.useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("allinone_todos", JSON.stringify(todos))
    }
  }, [todos, isLoaded])

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    setTodos([
      ...todos,
      {
        id: crypto.randomUUID(),
        text: inputValue.trim(),
        completed: false
      }
    ])
    setInputValue("")
  }

  const toggleComplete = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const removeTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id))
  }

  const clearCompleted = () => {
    setTodos(todos.filter(t => !t.completed))
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Simple To-Do List</CardTitle>
          <CardDescription>Manage your daily tasks locally in your browser.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input 
              placeholder="What needs to be done?" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={!inputValue.trim()}>
              <Plus data-icon="inline-start" /> Add
            </Button>
          </form>

          {isLoaded && todos.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 mb-2">
                <p className="text-sm text-muted-foreground font-medium">
                  {todos.filter(t => !t.completed).length} tasks remaining
                </p>
                {todos.some(t => t.completed) && (
                  <Button variant="ghost" size="sm" onClick={clearCompleted} className="h-8 text-xs">
                    Clear Completed
                  </Button>
                )}
              </div>
              
              <ul className="space-y-2">
                {todos.map(todo => (
                  <li 
                    key={todo.id} 
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${todo.completed ? 'bg-muted/50 border-muted' : 'bg-background hover:border-primary/50'}`}
                  >
                    <div 
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => toggleComplete(todo.id)}
                    >
                      {todo.completed ? (
                        <CheckCircle className="size-5 text-primary shrink-0" weight="fill" />
                      ) : (
                        <Circle className="size-5 text-muted-foreground shrink-0" />
                      )}
                      <span className={`break-all ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {todo.text}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon-sm" 
                      className="text-muted-foreground hover:text-destructive shrink-0 ml-2"
                      onClick={() => removeTodo(todo.id)}
                    >
                      <Trash />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isLoaded && todos.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/20">
              <p className="text-muted-foreground">You are all caught up!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
