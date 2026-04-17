"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Copy, Plus, Trash, CheckSquare, Square, ShareNetwork, CheckCircle } from "@phosphor-icons/react"
import { Label } from "@workspace/ui/components/label"

interface CheckItem {
  id: string
  text: string
  done: boolean
}

export function SharedChecklistTool() {
  const [items, setItems] = React.useState<CheckItem[]>([])
  const [input, setInput] = React.useState("")
  const [title, setTitle] = React.useState("My Checklist")
  const [copied, setCopied] = React.useState(false)
  const [isLoaded, setIsLoaded] = React.useState(false)

  // Initialize from URL or LocalStorage
  React.useEffect(() => {
    // Check URL Hash first
    const hash = window.location.hash
    if (hash && hash.startsWith("#list=")) {
      try {
        const encoded = hash.replace("#list=", "")
        const decoded = JSON.parse(atob(decodeURIComponent(encoded)))
        if (decoded.items && Array.isArray(decoded.items)) {
          setItems(decoded.items)
          setTitle(decoded.title || "Shared Checklist")
        }
      } catch {
        // Fallback or error
      }
    } else {
      // Fallback to local storage
      const saved = localStorage.getItem("allinone_shared_checklist")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setItems(parsed.items || [])
          setTitle(parsed.title || "My Checklist")
        } catch {}
      }
    }
    setIsLoaded(true)
  }, [])

  // Sync to local storage and update URL hash
  React.useEffect(() => {
    if (!isLoaded) return
    const bundle = { title, items }
    // Local storage
    localStorage.setItem("allinone_shared_checklist", JSON.stringify(bundle))
    // Update hash silently
    const encoded = encodeURIComponent(btoa(JSON.stringify(bundle)))
    window.history.replaceState(null, "", `#list=${encoded}`)
  }, [items, title, isLoaded])

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    setItems([...items, { id: crypto.randomUUID(), text: input.trim(), done: false }])
    setInput("")
  }

  const toggleItem = (id: string) => {
    setItems(items.map(i => i.id === id ? { ...i, done: !i.done } : i))
  }

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id))
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  if (!isLoaded) return null

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Shared Checklist</CardTitle>
              <CardDescription>Creates a sharable link automatically.</CardDescription>
            </div>
            <Button variant="secondary" onClick={handleShare}>
              {copied ? <CheckCircle className="text-green-500" /> : <ShareNetwork />}
              {copied ? "Link Copied!" : "Copy Share Link"}
            </Button>
          </div>
          <div>
             <Label className="sr-only">Checklist Title</Label>
             <Input 
               className="text-xl font-semibold border-transparent px-0 shadow-none hover:border-border focus-visible:border-primary rounded-none bg-transparent h-auto"
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               placeholder="Checklist Title"
             />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input 
              placeholder="Add an item..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={!input.trim()}>
              <Plus data-icon="inline-start" /> Add
            </Button>
          </form>

          {items.length > 0 ? (
            <ul className="space-y-2">
              {items.map((item) => (
                <li 
                  key={item.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${item.done ? 'bg-muted/30 border-transparent shadow-none' : 'bg-card shadow-sm hover:border-primary/50'}`}
                >
                  <div 
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => toggleItem(item.id)}
                  >
                    {item.done ? (
                      <CheckSquare className="size-5 text-primary shrink-0" weight="fill" />
                    ) : (
                      <Square className="size-5 text-muted-foreground shrink-0" />
                    )}
                    <span className={`break-all ${item.done ? 'line-through text-muted-foreground' : ''}`}>
                      {item.text}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon-sm" 
                    className="text-muted-foreground hover:text-destructive shrink-0 ml-2 opacity-50 hover:opacity-100"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-xl bg-muted/20">
              <p className="text-muted-foreground">List is empty.</p>
            </div>
          )}

          {items.length > 0 && (
            <div className="pt-2 text-center text-xs text-muted-foreground">
              {items.filter(i => i.done).length} / {items.length} completed
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="p-4 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-sm flex gap-3 text-left">
         <span className="font-bold">Pro Tip:</span>
         <p>The URL updates automatically. Copy and send it to anyone, and they will load this exact checklist in their browser! They can check items off locally.</p>
      </div>
    </div>
  )
}
