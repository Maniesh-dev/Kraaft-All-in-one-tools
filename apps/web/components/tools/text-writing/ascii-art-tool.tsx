"use client"

import { useState, useEffect, useCallback } from "react"
import { Copy, ArrowsCounterClockwise, TextT } from "@phosphor-icons/react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { toast } from "sonner"
import figlet from "figlet"
import standard from "figlet/importable-fonts/Standard.js"
import slant from "figlet/importable-fonts/Slant.js"
import shadow from "figlet/importable-fonts/Shadow.js"
import banner from "figlet/importable-fonts/Banner.js"
import script from "figlet/importable-fonts/Script.js"
import chunky from "figlet/importable-fonts/Chunky.js"

const FONT_MAP: Record<string, any> = {
  standard,
  slant,
  shadow,
  banner,
  script,
  chunky,
}

const FONTS = [
  { label: "Standard", value: "standard" },
  { label: "Slant", value: "slant" },
  { label: "Shadow", value: "shadow" },
  { label: "Banner", value: "banner" },
  { label: "Script", value: "script" },
  { label: "Chunky", value: "chunky" },
]

export function AsciiArtTool() {
  const [input, setInput] = useState("KRAAFT")
  const [font, setFont] = useState("standard")
  const [output, setOutput] = useState("")

  const generateArt = useCallback(() => {
    if (!input) {
      setOutput("")
      return
    }

    try {
      figlet.parseFont(font, FONT_MAP[font])
      figlet.text(
        input,
        {
          font: font as any,
          horizontalLayout: "default",
          verticalLayout: "default",
          width: 80,
          whitespaceBreak: true,
        },
        (err, data) => {
          if (err) {
            console.error(err)
            return
          }
          if (data) setOutput(data)
        }
      )
    } catch (e) {
      console.error(e)
    }
  }, [input, font])

  useEffect(() => {
    generateArt()
  }, [generateArt])

  const copyToClipboard = () => {
    if (!output) return
    navigator.clipboard.writeText(output)
    toast.success("Copied to clipboard")
  }

  const reset = () => {
    setInput("KRAAFT")
    setFont("standard")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Text</label>
                <Input
                  placeholder="Enter text to convert..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Choose Font</label>
                <Select value={font} onValueChange={setFont}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a font" />
                  </SelectTrigger>
                  <SelectContent>
                    {FONTS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                disabled={!output}
              >
                <Copy className="mr-2 h-4 w-4" weight="bold" />
                Copy ASCII
              </Button>
              <Button variant="ghost" size="sm" onClick={reset}>
                <ArrowsCounterClockwise className="mr-2 h-4 w-4" weight="bold" />
                Reset
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>

      {output && (
        <Card className="bg-slate-950 border-slate-800 overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">preview</span>
              <TextT className="h-3 w-3 text-slate-500" weight="bold" />
            </div>

            <pre className="p-6 text-emerald-500 font-mono text-[10px] sm:text-xs leading-[1.1] overflow-x-auto whitespace-pre">
              {output}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="pt-6 text-sm text-muted-foreground leading-relaxed">
          <h3 className="font-semibold mb-2 text-foreground">Usage Tip</h3>
          <p>
            ASCII art banners are great for code comments, terminal MOTDs (Message of the Day),
            or adding a retro aesthetic to your README files. Note that complex banners might wrap
            on mobile devices and are best viewed on wide displays.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
