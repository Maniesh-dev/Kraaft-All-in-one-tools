"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Plus, Trash, CheckSquare, Square, ShoppingCart } from "@phosphor-icons/react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"

const CATEGORIES = [
  "Produce", 
  "Dairy & Eggs", 
  "Meat & Seafood", 
  "Pantry", 
  "Bakery", 
  "Frozen", 
  "Beverages", 
  "Household", 
  "Other"
]

interface GroceryItem {
  id: string
  text: string
  category: string
  done: boolean
}

export function GroceryListTool() {
  const [items, setItems] = React.useState<GroceryItem[]>([])
  const [input, setInput] = React.useState("")
  const [selectedCat, setSelectedCat] = React.useState(CATEGORIES[0] || "")
  const [isLoaded, setIsLoaded] = React.useState(false)

  React.useEffect(() => {
    const saved = localStorage.getItem("allinone_grocery_list")
    if (saved) {
      try {
        setItems(JSON.parse(saved))
      } catch {}
    }
    setIsLoaded(true)
  }, [])

  React.useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("allinone_grocery_list", JSON.stringify(items))
    }
  }, [items, isLoaded])

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    setItems([
      ...items,
      { id: crypto.randomUUID(), text: input.trim(), category: selectedCat, done: false }
    ])
    setInput("")
  }

  const toggleItem = (id: string) => {
    setItems(items.map(i => i.id === id ? { ...i, done: !i.done } : i))
  }

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id))
  }

  const clearChecked = () => {
    setItems(items.filter(i => !i.done))
  }

  if (!isLoaded) return null

  // Group items by category
  const grouped: Record<string, GroceryItem[]> = {}
  CATEGORIES.forEach(c => grouped[c] = [])
  items.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = []
    grouped[item.category]!.push(item)
  })

  // Filter out empty categories
  const activeCategories = CATEGORIES.filter(c => (grouped[c]?.length ?? 0) > 0)
  // Ensure "Other" and any custom categories show up
  Object.keys(grouped).forEach(k => {
    if (!activeCategories.includes(k) && (grouped[k]?.length ?? 0) > 0) activeCategories.push(k)
  })

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart weight="bold" className="text-primary" /> Grocery List
            </CardTitle>
            <CardDescription>Organize your shopping trip by aisle.</CardDescription>
          </div>
          {items.some(i => i.done) && (
             <Button variant="outline" onClick={clearChecked}>
               Remove Checked
             </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-8">
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex gap-2">
              <Input 
                placeholder="What do you need?" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedCat} onValueChange={setSelectedCat}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" disabled={!input.trim()}>
                <Plus data-icon="inline-start" /> Add
              </Button>
            </div>
          </form>

          {activeCategories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeCategories.map(category => (
                <div key={category} className="space-y-3">
                  <h3 className="font-semibold px-1 text-primary border-b pb-1">{category}</h3>
                  <ul className="space-y-1">
                    {grouped[category]!.map(item => (
                      <li 
                        key={item.id} 
                        className={`flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors group ${item.done ? 'opacity-60' : ''}`}
                      >
                        <div 
                          className="flex items-center gap-2 flex-1 cursor-pointer"
                          onClick={() => toggleItem(item.id)}
                        >
                          {item.done ? (
                            <CheckSquare className="size-4 shrink-0 text-primary" weight="fill" />
                          ) : (
                            <Square className="size-4 shrink-0 text-muted-foreground" />
                          )}
                          <span className={`text-sm ${item.done ? 'line-through text-muted-foreground' : ''}`}>
                            {item.text}
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon-sm" 
                          className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeItem(item.id)}
                        >
                          <span className="sr-only">Remove</span>
                          <Trash className="size-3" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/20">
              <ShoppingCart className="size-10 mx-auto text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground font-medium">Your cart is empty.</p>
              <p className="text-xs text-muted-foreground mt-1">Add items above to start shopping.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
