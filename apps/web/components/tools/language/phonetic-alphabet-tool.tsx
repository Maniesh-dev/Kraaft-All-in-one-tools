"use client"

import { useState, useCallback } from "react"
import { Copy, ArrowsCounterClockwise, SpeakerHigh } from "@phosphor-icons/react"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { Card, CardContent } from "@workspace/ui/components/card"
import { toast } from "sonner"

const NATO_ALPHABET: Record<string, string> = {
  A: "Alpha",
  B: "Bravo",
  C: "Charlie",
  D: "Delta",
  E: "Echo",
  F: "Foxtrot",
  G: "Golf",
  H: "Hotel",
  I: "India",
  J: "Juliett",
  K: "Kilo",
  L: "Lima",
  M: "Mike",
  N: "November",
  O: "Oscar",
  P: "Papa",
  Q: "Quebec",
  R: "Romeo",
  S: "Sierra",
  T: "Tango",
  U: "Uniform",
  V: "Victor",
  W: "Whiskey",
  X: "X-ray",
  Y: "Yankee",
  Z: "Zulu",
  "0": "Zero",
  "1": "One",
  "2": "Two",
  "3": "Three",
  "4": "Four",
  "5": "Five",
  "6": "Six",
  "7": "Seven",
  "8": "Eight",
  "9": "Nine",
  ".": "Stop",
}

export function PhoneticAlphabetTool() {
  const [input, setInput] = useState("")

  const convertToNato = useCallback((text: string) => {
    return text
      .toUpperCase()
      .split("")
      .map((char) => NATO_ALPHABET[char] || char)
      .join(" ")
  }, [])

  const output = convertToNato(input)

  const copyToClipboard = () => {
    if (!output) return
    navigator.clipboard.writeText(output)
    toast.success("Copied to clipboard")
  }

  const reset = () => {
    setInput("")
  }

  const speak = () => {
    if (!output) return
    try {
      const utterance = new SpeechSynthesisUtterance(output)
      window.speechSynthesis.speak(utterance)
    } catch (e) {
      toast.error("Audio playback error")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Enter Text</label>
              <Textarea
                placeholder="Type something to convert to NATO phonetic alphabet..."
                className="min-h-[120px] resize-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
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
                Copy Result
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={speak}
                disabled={!output}
              >
                <SpeakerHigh className="mr-2 h-4 w-4" weight="bold" />
                Listen
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
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              NATO Phonetic Result
            </h3>
            <div className="text-xl font-medium break-words leading-relaxed">
              {output}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">What is the NATO Phonetic Alphabet?</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The NATO phonetic alphabet is a spelling alphabet used by professional
            communicators, such as pilots, police, and the military, to ensure that
            letters and numbers are clearly understood, especially over radio or
            noisy connections. For example, instead of saying "B", you say "Bravo"
            to avoid confusion with "D", "P", or "E".
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
