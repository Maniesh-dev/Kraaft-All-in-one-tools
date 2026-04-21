"use client"

import { useState, useMemo } from "react"
import { Copy, ArrowsCounterClockwise, Table } from "@phosphor-icons/react"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { Card, CardContent } from "@workspace/ui/components/card"
import { toast } from "sonner"

export function CsvToMarkdownTool() {
  const [input, setInput] = useState("Name,Age,Role\nJohn Doe,30,Developer\nJane Smith,25,Designer")

  const markdownTable = useMemo(() => {
    if (!input.trim()) return ""

    const lines = input.trim().split("\n")
    if (lines.length === 0) return ""

    const rows = lines.map(line => {
      // Simple CSV parsing (splits by comma, respects basic quotes)
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",")
      return matches.map(cell => cell.replace(/^"|"$/g, "").trim())
    })

    if (rows.length === 0) return ""

    const header = rows[0]
    if (!header) return ""
    const body = rows.slice(1)

    const headerRow = `| ${header.join(" | ")} |`
    const separatorRow = `| ${header.map(() => "---").join(" | ")} |`
    const bodyRows = body.map(row => `| ${row.join(" | ")} |`).join("\n")

    return `${headerRow}\n${separatorRow}\n${bodyRows}`
  }, [input])

  const copyToClipboard = () => {
    if (!markdownTable) return
    navigator.clipboard.writeText(markdownTable)
    toast.success("Copied to clipboard")
  }

  const reset = () => {
    setInput("")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">CSV Input</label>
              <Textarea
                placeholder="Paste your CSV data here (comma separated)..."
                className="min-h-[120px] font-mono text-sm resize-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                disabled={!markdownTable}
              >
                <Copy className="mr-2 h-4 w-4" weight="bold" />
                Copy Markdown
              </Button>
              <Button variant="ghost" size="sm" onClick={reset}>
                <ArrowsCounterClockwise className="mr-2 h-4 w-4" weight="bold" />
                Reset
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>

      {markdownTable && (
        <Card className="bg-slate-950 border-slate-800 overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">Markdown Preview</span>
              <Table className="h-3 w-3 text-slate-500" weight="bold" />
            </div>

            <pre className="p-6 text-orange-400 font-mono text-sm leading-relaxed overflow-x-auto whitespace-pre">
              {markdownTable}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="pt-6 text-sm text-muted-foreground leading-relaxed">
          <h3 className="font-semibold mb-2 text-foreground">Usage Note</h3>
          <p>
            Markdown tables are perfect for documentation, README files, and GitHub issues. 
            This converter takes your CSV rows and generates a standard GFM (GitHub Flavored Markdown) 
            compliant table. It assumes the first line of your input is the header row.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
