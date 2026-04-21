"use client"

import { useState, useMemo } from "react"
import { Copy, ArrowsCounterClockwise, Code } from "@phosphor-icons/react"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { toast } from "sonner"

type Format = "binary" | "hex" | "base64" | "decimal" | "octal"

export function TextToBinaryHexTool() {
  const [input, setInput] = useState("")
  const [format, setFormat] = useState<Format>("binary")

  const convert = useMemo(() => {
    if (!input) return ""

    try {
      if (format === "base64") {
        return btoa(input)
      }

      return input
        .split("")
        .map((char) => {
          const code = char.charCodeAt(0)
          switch (format) {
            case "binary":
              return code.toString(2).padStart(8, "0")
            case "hex":
              return code.toString(16).padStart(2, "0").toUpperCase()
            case "decimal":
              return code.toString(10)
            case "octal":
              return code.toString(8).padStart(3, "0")
            default:
              return char
          }
        })
        .join(" ")
    } catch (e) {
      return "Error: Possible invalid character for encoding"
    }
  }, [input, format])

  const copyToClipboard = () => {
    if (!convert) return
    navigator.clipboard.writeText(convert)
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-sm font-medium">Input Text</label>
                <Textarea
                  placeholder="Enter text to convert..."
                  className="min-h-[100px] resize-none"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Format</label>
                <Select value={format} onValueChange={(v) => setFormat(v as Format)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="binary">Binary (Base 2)</SelectItem>
                    <SelectItem value="hex">Hexadecimal (Base 16)</SelectItem>
                    <SelectItem value="base64">Base64</SelectItem>
                    <SelectItem value="decimal">Decimal (UTF-16)</SelectItem>
                    <SelectItem value="octal">Octal (Base 8)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                disabled={!convert || convert.startsWith("Error")}
              >
                <Copy className="mr-2 h-4 w-4" weight="bold" />
                Copy Result
              </Button>
              <Button variant="ghost" size="sm" onClick={reset}>
                <ArrowsCounterClockwise className="mr-2 h-4 w-4" weight="bold" />
                Reset
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>

      {convert && (
        <Card className="bg-slate-950 border-slate-800 overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">{format} output</span>
              <Code className="h-3 w-3 text-slate-500" weight="bold" />
            </div>

            <pre className="p-6 text-blue-400 font-mono text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap">
              {convert}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="pt-6 text-sm text-muted-foreground leading-relaxed">
          <h3 className="font-semibold mb-2 text-foreground">Character Encoding</h3>
          <p>
            Standard characters are converted into their UTF-16 code units (decimal),
            which are then transformed into various bases like Binary or Hex. 
            <strong>Base64</strong> is a special encoding that represents binary data 
            in an ASCII string format, often used for data URI schemes or email attachments.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
