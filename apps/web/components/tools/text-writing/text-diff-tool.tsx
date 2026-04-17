"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Textarea } from "@workspace/ui/components/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { GitDiff, SplitHorizontal } from "@phosphor-icons/react"
import { diffWords, diffLines, diffChars, Change } from "diff"

type DiffMode = "words" | "lines" | "chars"

export function TextDiffTool() {
  const [originalText, setOriginalText] = React.useState("")
  const [modifiedText, setModifiedText] = React.useState("")
  const [diffMode, setDiffMode] = React.useState<DiffMode>("words")
  const [isLoaded, setIsLoaded] = React.useState(false)

  React.useEffect(() => {
    setIsLoaded(true)
  }, [])

  const diffs: Change[] = React.useMemo(() => {
    if (!originalText && !modifiedText) return []
    if (diffMode === "words") {
      return diffWords(originalText, modifiedText)
    } else if (diffMode === "lines") {
      return diffLines(originalText, modifiedText)
    } else {
      return diffChars(originalText, modifiedText)
    }
  }, [originalText, modifiedText, diffMode])

  if (!isLoaded) return null

  const getHighlightClass = (part: Change) => {
    if (part.added) return "bg-green-500/20 text-green-700 dark:text-green-300 rounded-sm"
    if (part.removed) return "bg-red-500/20 text-red-700 dark:text-red-300 line-through rounded-sm"
    return "text-muted-foreground"
  }

  // Displaying diff block nicely
  const diffElements = diffs.map((part, index) => {
    const spanClass = getHighlightClass(part)
    // Replace newlines with <br /> for proper HTML display if needed, but since it's inside whitespace-pre-wrap we can just output text
    return (
      <span key={index} className={spanClass}>
        {part.value}
      </span>
    )
  })

  // Statistics
  const additions = diffs.filter(d => d.added).length
  const deletions = diffs.filter(d => d.removed).length

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitDiff className="text-primary" /> Text Diff Checker
            </CardTitle>
            <CardDescription>Compare two pieces of text to see what was added or removed.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={diffMode} onValueChange={(v: DiffMode) => setDiffMode(v)}>
              <SelectTrigger className="w-[180px]">
                <SplitHorizontal className="mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="words">Word Level Diff</SelectItem>
                <SelectItem value="lines">Line Level Diff</SelectItem>
                <SelectItem value="chars">Character Level Diff</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold tracking-wide text-muted-foreground">Original Text</label>
              <Textarea 
                placeholder="Paste original text here..." 
                className="min-h-[250px] resize-y font-mono text-sm"
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold tracking-wide text-muted-foreground">Modified Text</label>
              <Textarea 
                placeholder="Paste modified text here to compare..." 
                className="min-h-[250px] resize-y font-mono text-sm"
                value={modifiedText}
                onChange={(e) => setModifiedText(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-card overflow-hidden">
             <div className="bg-muted/40 px-4 py-3 border-b flex items-center justify-between">
                <span className="font-semibold text-sm">Diff Result</span>
                {(additions > 0 || deletions > 0) && (
                   <div className="flex items-center gap-3 text-xs font-bold">
                     {additions > 0 && <span className="text-green-600 dark:text-green-400">+{additions} Additions</span>}
                     {deletions > 0 && <span className="text-red-600 dark:text-red-400">-{deletions} Deletions</span>}
                   </div>
                )}
             </div>
             <div className="p-4 min-h-[150px] bg-background text-sm font-mono whitespace-pre-wrap break-words leading-relaxed overflow-x-auto">
               {diffs.length > 0 ? (
                 diffElements
               ) : (
                 <span className="text-muted-foreground/50">Enter text to see differences...</span>
               )}
             </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="p-4 bg-muted/30 text-muted-foreground rounded-lg text-sm text-center">
         Changes are color-coded: <span className="text-red-500 line-through font-mono bg-red-500/10 px-1 mx-1 rounded">red with strikethrough</span> means removed, and <span className="text-green-500 font-mono bg-green-500/10 px-1 mx-1 rounded">green</span> means added.
      </div>
    </div>
  )
}
