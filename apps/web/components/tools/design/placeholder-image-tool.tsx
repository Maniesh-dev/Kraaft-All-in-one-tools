"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { DownloadSimple, ImageSquare, ArrowsOut } from "@phosphor-icons/react"
import { Label } from "@workspace/ui/components/label"

export function PlaceholderImageTool() {
  const [width, setWidth] = React.useState("600")
  const [height, setHeight] = React.useState("400")
  const [bgColor, setBgColor] = React.useState("#cccccc")
  const [textColor, setTextColor] = React.useState("#666666")
  const [text, setText] = React.useState("")
  
  const [previewSrc, setPreviewSrc] = React.useState<string | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  const generatePlaceholder = React.useCallback(() => {
     if (!canvasRef.current) return
     
     const canvas = canvasRef.current
     const ctx = canvas.getContext("2d")
     if (!ctx) return
     
     const w = parseInt(width) || 600
     const h = parseInt(height) || 400
     
     // Cap dimensions to prevent browser crash (e.g., 10000x10000)
     const safeW = Math.max(10, Math.min(4000, w))
     const safeH = Math.max(10, Math.min(4000, h))

     canvas.width = safeW
     canvas.height = safeH
     
     // Background
     ctx.fillStyle = bgColor
     ctx.fillRect(0, 0, safeW, safeH)
     
     // Text Config
     ctx.fillStyle = textColor
     ctx.textAlign = "center"
     ctx.textBaseline = "middle"
     
     // Dynamic font size
     const fontSize = Math.min(safeW, safeH) / 6
     ctx.font = `bold ${fontSize}px Inter, sans-serif`
     
     const displayText = text.trim() || `${safeW} × ${safeH}`
     ctx.fillText(displayText, safeW / 2, safeH / 2)
     
     setPreviewSrc(canvas.toDataURL("image/png"))
  }, [width, height, bgColor, textColor, text])

  React.useEffect(() => {
      // Debounce slightly when typing
      const timer = setTimeout(() => {
         generatePlaceholder()
      }, 50)
      return () => clearTimeout(timer)
  }, [generatePlaceholder])

  const handleDownload = () => {
    if (!previewSrc) return
    const link = document.createElement("a")
    link.download = `placeholder-${width}x${height}.png`
    link.href = previewSrc
    link.click()
  }

  const setPreset = (w: string, h: string) => {
     setWidth(w)
     setHeight(h)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageSquare className="text-primary" /> Placeholder Image Generator
          </CardTitle>
          <CardDescription>Generate customized placeholder blocks for mockups perfectly sized and labeled natively.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          
          <canvas ref={canvasRef} className="hidden" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             
             {/* Engine Config */}
             <div className="space-y-6">
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label>Width (px)</Label>
                      <Input type="number" value={width} onChange={e => setWidth(e.target.value)} />
                   </div>
                   <div className="space-y-2">
                      <Label>Height (px)</Label>
                      <Input type="number" value={height} onChange={e => setHeight(e.target.value)} />
                   </div>
                </div>

                <div className="flex flex-wrap gap-2">
                   <Button variant="secondary" size="sm" onClick={() => setPreset("800", "600")}>800x600</Button>
                   <Button variant="secondary" size="sm" onClick={() => setPreset("1280", "720")}>1280x720</Button>
                   <Button variant="secondary" size="sm" onClick={() => setPreset("1920", "1080")}>1920x1080</Button>
                   <Button variant="secondary" size="sm" onClick={() => setPreset("500", "500")}>500x500</Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label>Background</Label>
                      <div className="flex gap-2">
                         <Input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-12 h-10 p-1" />
                         <Input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} className="font-mono text-xs uppercase" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <Label>Text Color</Label>
                      <div className="flex gap-2">
                         <Input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-12 h-10 p-1" />
                         <Input type="text" value={textColor} onChange={e => setTextColor(e.target.value)} className="font-mono text-xs uppercase" />
                      </div>
                   </div>
                </div>

                <div className="space-y-2">
                   <Label>Custom Text (Optional)</Label>
                   <Input value={text} onChange={e => setText(e.target.value)} placeholder="Leave blank for dimensions" />
                </div>

                <Button onClick={handleDownload} className="w-full shadow-md" size="lg">
                   <DownloadSimple className="mr-2" size={20} /> Download PNG
                </Button>

             </div>

             {/* Output Stage */}
             <div className="bg-muted/10 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px]">
                 {previewSrc ? (
                    <div className="relative group max-w-full">
                       <span className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 flex items-center gap-1 rounded-md shadow-md z-10"><ArrowsOut/> {parseInt(width)||600}x{parseInt(height)||400}</span>
                       {/* eslint-disable-next-line @next/next/no-img-element */}
                       <img src={previewSrc} alt="Placeholder" className="max-h-[400px] object-contain shadow-sm border border-black/5" />
                    </div>
                 ) : (
                    <span className="text-muted-foreground animate-pulse">Rendering...</span>
                 )}
             </div>

          </div>

        </CardContent>
      </Card>
    </div>
  )
}
