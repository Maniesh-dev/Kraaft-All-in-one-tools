"use client"

import { useState, useRef, useCallback } from "react"
import { DownloadSimple, ArrowsCounterClockwise, Image as ImagePh, UploadSimple } from "@phosphor-icons/react"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { toast } from "sonner"

export function SvgToPngTool() {
  const [svgCode, setSvgCode] = useState('<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">\n  <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />\n</svg>')
  const [pngUrl, setPngUrl] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const convertToPng = useCallback(() => {
    if (!svgCode.trim()) return

    try {
      const blob = new Blob([svgCode], { type: "image/svg+xml;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const img = new Image()

      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Set high resolution factor
        const scale = 2
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        ctx.scale(scale, scale)

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)

        const dataUrl = canvas.toDataURL("image/png")
        setPngUrl(dataUrl)
        URL.revokeObjectURL(url)
      }

      img.onerror = () => {
        toast.error("Invalid SVG code. Please check your syntax.")
      }


      img.src = url
    } catch (e) {
      console.error(e)
    }
  }, [svgCode, toast])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setSvgCode(content)
      setPngUrl(null)
    }
    reader.readAsText(file)
  }

  const downloadPng = () => {
    if (!pngUrl) return
    const link = document.createElement("a")
    link.download = "converted-image.png"
    link.href = pngUrl
    link.click()
  }

  const reset = () => {
    setSvgCode("")
    setPngUrl(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-1 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">SVG Code / Input</label>
                  <div className="relative">
                    <Input
                      type="file"
                      accept=".svg"
                      className="hidden"
                      id="svg-upload"
                      onChange={handleFileUpload}
                    />
                    <label
                      htmlFor="svg-upload"
                      className="text-xs flex items-center gap-1 cursor-pointer hover:text-primary transition-colors text-muted-foreground"
                    >
                      <UploadSimple className="h-3 w-3" weight="bold" />
                      Upload .svg file
                    </label>
                  </div>

                </div>
                <Textarea
                  placeholder="Paste your <svg>...</svg> code here..."
                  className="min-h-[150px] font-mono text-xs resize-none"
                  value={svgCode}
                  onChange={(e) => {
                    setSvgCode(e.target.value)
                    setPngUrl(null)
                  }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={convertToPng} disabled={!svgCode.trim()}>
                Generate PNG
              </Button>
              <Button
                variant="outline"
                onClick={downloadPng}
                disabled={!pngUrl}
              >
                <DownloadSimple className="mr-2 h-4 w-4" weight="bold" />
                Download PNG
              </Button>
              <Button variant="ghost" onClick={reset}>
                <ArrowsCounterClockwise className="mr-2 h-4 w-4" weight="bold" />
                Reset
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>

      <canvas ref={canvasRef} className="hidden" />

      {pngUrl && (
        <Card className="bg-muted/50 border-dashed overflow-hidden">
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[250px] gap-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Preview
            </h3>
            <div className="bg-white p-4 rounded-lg shadow-sm max-w-full overflow-auto">
              <img src={pngUrl} alt="Converted" className="max-h-[300px] object-contain" />
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="pt-6 text-sm text-muted-foreground leading-relaxed">
          <h3 className="font-semibold mb-2 text-foreground flex items-center gap-1">
            <ImagePh className="h-4 w-4" weight="bold" /> Why convert SVG to PNG?
          </h3>

          <p>
            SVGs are vector-based and infinitely scalable, but some legacy platforms, 
            social media sites, and design tools only support raster formats like PNG. 
            This tool renders your vector code onto a high-resolution canvas to give you 
            a crisp, transparent PNG file ready for use anywhere.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
