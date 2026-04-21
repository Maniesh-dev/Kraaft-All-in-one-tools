"use client"

import { useState, useMemo } from "react"
import { ArrowsCounterClockwise, Hash, TextT } from "@phosphor-icons/react"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { Card, CardContent } from "@workspace/ui/components/card"
import { toast } from "sonner"
import { syllable } from "syllable"

export function SyllableCounterTool() {
  const [input, setInput] = useState("")

  const stats = useMemo(() => {
    if (!input.trim()) return { syllables: 0, words: 0, avgSyllables: 0 }
    
    const count = syllable(input)
    const words = input.trim().split(/\s+/).length
    const avg = count / words
    
    return {
      syllables: count,
      words: words,
      avgSyllables: parseFloat(avg.toFixed(2)),
    }
  }, [input])

  const reset = () => {
    setInput("")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Your Text</label>
              <Textarea
                placeholder="Type or paste your text here to count syllables..."
                className="min-h-[150px] resize-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={reset}>
                <ArrowsCounterClockwise className="mr-2 h-4 w-4" weight="bold" />
                Reset
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
            <Hash className="h-5 w-5 text-primary mb-2" weight="bold" />
            <span className="text-3xl font-bold">{stats.syllables}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">
              Total Syllables
            </span>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
            <TextT className="h-5 w-5 text-primary mb-2" weight="bold" />
            <span className="text-3xl font-bold">{stats.words}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">
              Total Words
            </span>
          </CardContent>
        </Card>


        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
            <div className="h-5 w-5 flex items-center justify-center text-primary font-bold mb-2">/</div>
            <span className="text-3xl font-bold">{stats.avgSyllables}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">
              Avg. Syllables / Word
            </span>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6 text-sm text-muted-foreground leading-relaxed">
          <h3 className="font-semibold mb-2 text-foreground">About Syllable Counting</h3>
          <p>
            Syllable counting is often used in linguistics and writing to determine the 
            complexity and readability of text. This tool uses a sophisticated algorithm 
            that handles common English patterns, prefixes, and suffixes to estimate 
            syllable counts accurately.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
