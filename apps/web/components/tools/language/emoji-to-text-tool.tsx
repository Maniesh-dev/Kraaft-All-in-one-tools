"use client"

import { useState, useCallback } from "react"
import { Copy, ArrowsCounterClockwise, MagnifyingGlass } from "@phosphor-icons/react"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { Card, CardContent } from "@workspace/ui/components/card"
import { toast } from "sonner"
import emoji from "emoji-dictionary"

export function EmojiToTextTool() {
  const [input, setInput] = useState("")

  const convertEmojiToText = useCallback((text: string) => {
    // Regex to match common emojis
    const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g
    
    return text.replace(emojiRegex, (match) => {
      const name = emoji.getName(match)
      return name ? `:${name}:` : match
    })
  }, [])

  const output = convertEmojiToText(input)

  const copyToClipboard = () => {
    if (!output) return
    navigator.clipboard.writeText(output)
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
              <label className="text-sm font-medium mb-2 block">
                Paste Text with Emojis
              </label>
              <Textarea
                placeholder="Paste some emojis here (e.g., 😄 ❤️ 🚀)..."
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
                disabled={!output || output === input}
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

      {output && output !== input && (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              Textual Description Result
            </h3>
            <div className="text-lg font-medium break-words leading-relaxed">
              {output}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">How it works</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This tool scans your text for emojis and replaces them with their
            corresponding names (like <code>:heart:</code> or <code>:smile:</code>).
            This is useful for accessibility, legacy systems that don't support
            emojis, or for technical documentation where you want to describe an
            icon rather than displaying it.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
