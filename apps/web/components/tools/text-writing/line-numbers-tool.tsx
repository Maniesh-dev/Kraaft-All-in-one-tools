"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { ListNumbers, Copy, Trash, ArrowsLeftRight } from "@phosphor-icons/react"

export function LineNumbersTool() {
  const [input, setInput] = React.useState("")
  const [output, setOutput] = React.useState("")
  const [mode, setMode] = React.useState<"add" | "remove">("add")
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!input) {
      setOutput("")
      return
    }

    const lines = input.split("\n")
    if (mode === "add") {
      // Find padding length
      const padLen = String(lines.length).length
      const numbered = lines.map((line, i) => {
        const num = String(i + 1).padStart(padLen, " ")
        return `${num}. ${line}`
      })
      setOutput(numbered.join("\n"))
    } else {
      // Remove numbers (e.g., "1. ", "01) ", "1-", etc or trailing space)
      const removed = lines.map(line => {
        return line.replace(/^\s*\d+[\.\)\-]?\s*/, "")
      })
      setOutput(removed.join("\n"))
    }
  }, [input, mode])

  const handleCopy = async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const toggleMode = () => setMode(m => m === "add" ? "remove" : "add")

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ListNumbers className="text-primary" /> Line Number Adder
            </CardTitle>
            <CardDescription>Cleanly add or strip numbered lines from a text block.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={toggleMode} className="w-[180px]">
              <ArrowsLeftRight className="mr-2" />
              {mode === "add" ? "Mode: Add Numbers" : "Mode: Remove Numbers"}
            </Button>
            <Button variant="destructive" size="icon" onClick={() => setInput("")}>
              <Trash />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-sm font-semibold tracking-wide text-muted-foreground">Original Text</label>
                <Textarea 
                  placeholder={mode === "add" ? "Paste text without numbers..." : "Paste numbered text to strip (e.g. 1. Hello)..."} 
                  className="min-h-[400px] resize-y font-mono whitespace-pre"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
             </div>
             <div className="space-y-2 relative">
                <label className="text-sm font-semibold tracking-wide text-muted-foreground flex justify-between">
                  <span>Processed Output</span>
                  {mode === "add" && <span className="text-xs text-primary font-bold">Added</span>}
                  {mode === "remove" && <span className="text-xs text-destructive font-bold">Removed</span>}
                </label>
                <Textarea 
                  readOnly
                  placeholder="Output will appear here..." 
                  className="min-h-[400px] resize-y bg-muted/20 font-mono whitespace-pre"
                  value={output}
                />
                {output && (
                  <Button
                    className="absolute top-9 right-3 shadow-md"
                    size="sm"
                    onClick={handleCopy}
                  >
                    {copied ? "Copied!" : "Copy Output"} <Copy className="ml-1" />
                  </Button>
                )}
             </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
          <strong>Pad Aware:</strong> Lines align properly (e.g. 9.  10. 100.)
        </span>
        <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
           <strong>Smart Strip:</strong> Detects periods, dashes, and parens
        </span>
      </div>
    </div>
  )
}
