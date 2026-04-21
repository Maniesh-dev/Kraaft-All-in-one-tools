"use client"

import { useState, useCallback, useMemo } from "react"
import { Copy, ArrowsCounterClockwise, Lightning } from "@phosphor-icons/react"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Slider } from "@workspace/ui/components/slider"
import { toast } from "sonner"

const ZALGO_UP = [
  "\u030d", "\u030e", "\u0304", "\u0305", "\u0306", "\u0307", "\u0308", "\u030a", "\u030b", "\u030c",
  "\u0300", "\u0301", "\u0302", "\u0303", "\u0310", "\u0311", "\u0312", "\u0313", "\u0314", "\u031a",
  "\u031b", "\u033d", "\u033e", "\u033f", "\u0340", "\u0341", "\u0342", "\u0343", "\u0344", "\u0346",
  "\u034a", "\u034b", "\u034c", "\u0350", "\u0351", "\u0352", "\u0357", "\u035b", "\u0363", "\u0364",
  "\u0365", "\u0366", "\u0367", "\u0368", "\u0369", "\u036a", "\u036b", "\u036c", "\u036d", "\u036e",
  "\u036f", "\u0483", "\u0484", "\u0485", "\u0486"
]

const ZALGO_MID = [
  "\u0315", "\u031b", "\u0340", "\u0341", "\u0358", "\u035c", "\u035d", "\u035e", "\u035f", "\u0360",
  "\u0361", "\u0362", "\u0338", "\u0337", "\u0334", "\u0335", "\u0336", "\u034f", "\u031f", "\u0359",
  "\u035a", "\u0320"
]

const ZALGO_DOWN = [
  "\u0316", "\u0317", "\u0318", "\u0319", "\u031c", "\u031d", "\u031e", "\u031f", "\u0320", "\u0321",
  "\u0322", "\u0323", "\u0324", "\u0325", "\u0326", "\u0327", "\u0328", "\u0329", "\u032a", "\u032b",
  "\u032c", "\u032d", "\u032e", "\u032f", "\u0330", "\u0331", "\u0332", "\u0333", "\u0339", "\u033a",
  "\u033b", "\u033c", "\u0345", "\u0347", "\u0348", "\u0349", "\u034d", "\u034e", "\u0353", "\u0354",
  "\u0355", "\u0356", "\u0359", "\u035a", "\u0323"
]

export function ZalgoTextTool() {
  const [input, setInput] = useState("")
  const [intensity, setIntensity] = useState([50])

  const generateZalgo = useCallback((text: string, count: number) => {
    let result = ""
    for (let i = 0; i < text.length; i++) {
      result += text[i]
      for (let j = 0; j < count; j++) {
        result += ZALGO_UP[Math.floor(Math.random() * ZALGO_UP.length)]
        result += ZALGO_MID[Math.floor(Math.random() * ZALGO_MID.length)]
        result += ZALGO_DOWN[Math.floor(Math.random() * ZALGO_DOWN.length)]
      }
    }
    return result
  }, [])

  const output = useMemo(() => generateZalgo(input, intensity[0] ?? 50), [input, intensity, generateZalgo])

  const copyToClipboard = () => {
    if (!output) return
    navigator.clipboard.writeText(output)
    toast.success("Copied to clipboard")
  }

  const reset = () => {
    setInput("Glitch Me")
    setIntensity([5])
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Source Text</label>
              <Textarea
                placeholder="Enter text to glitch..."
                className="min-h-[100px] resize-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Corruption Level ({intensity[0]})</label>
                <Lightning className="h-4 w-4 text-primary animate-pulse" weight="fill" />
              </div>

              <Slider
                value={intensity}
                onValueChange={setIntensity}
                max={20}
                min={1}
                step={1}
                className="py-4"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                disabled={!output}
              >
                <Copy className="mr-2 h-4 w-4" weight="bold" />
                Copy Glitch
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
        <Card className="bg-slate-950 border-slate-800">
          <CardContent className="pt-8 pb-12 px-8 overflow-hidden">
            <div className="text-xl font-medium text-slate-200 break-words leading-loose text-center">
              {output}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="pt-6 text-sm text-muted-foreground leading-relaxed">
          <h3 className="font-semibold mb-2 text-foreground">H̵̡e̶̡ ̶̡C̵̡o̵̡m̸̡e̷̡s̷̡</h3>
          <p>
            Zalgo text is created by stacking multiple combining characters (diacritics)
            above, below, and in the middle of standard characters. It originated from
            internet creepypasta culture and is used to create "broken" or "demonic" looking
            text effects. High intensity levels might make the text unreadable!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
