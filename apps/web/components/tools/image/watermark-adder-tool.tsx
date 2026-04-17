"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { TextAa, DownloadSimple, UploadSimple, Image as ImageIcon } from "@phosphor-icons/react"
import { Label } from "@workspace/ui/components/label"

export function WatermarkAdderTool() {
  const [imageSrc, setImageSrc] = React.useState<string | null>(null)
  const [originalName, setOriginalName] = React.useState("")
  const [imgObj, setImgObj] = React.useState<HTMLImageElement | null>(null)
  
  const [watermarkText, setWatermarkText] = React.useState("© Copyright")
  const [watermarkColor, setWatermarkColor] = React.useState("#ffffff")
  const [watermarkOpacity, setWatermarkOpacity] = React.useState("0.5")
  const [watermarkSize, setWatermarkSize] = React.useState("48")
  
  const [previewSrc, setPreviewSrc] = React.useState<string | null>(null)

  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setOriginalName(file.name.split('.')[0] || "image")
    const reader = new FileReader()
    reader.onload = (event) => {
      const src = event.target?.result as string
      setImageSrc(src)
      const img = new Image()
      img.onload = () => {
         setImgObj(img)
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  const applyWatermark = React.useCallback(() => {
    if (!imgObj || !canvasRef.current || !imageSrc) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = imgObj.width
    canvas.height = imgObj.height
    
    // Draw original image
    ctx.drawImage(imgObj, 0, 0)
    
    // Watermark settings
    ctx.globalAlpha = parseFloat(watermarkOpacity)
    ctx.fillStyle = watermarkColor
    
    // Calculate size relative to image width if needed, or use absolute
    const maxDimension = Math.max(canvas.width, canvas.height)
    // Scale font size so it's somewhat responsive to original image size
    const scaledFontSize = (parseInt(watermarkSize) / 500) * maxDimension
    
    ctx.font = `bold ${scaledFontSize}px sans-serif`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    
    // Positioning (Center)
    const x = canvas.width / 2
    const y = canvas.height / 2
    
    // Add nice shadow for readability
    ctx.shadowColor = "rgba(0,0,0,0.8)"
    ctx.shadowBlur = scaledFontSize * 0.1
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2

    // Draw text recursively or just center
    // Let's do a repeating diagonal watermark pattern for better protection
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(-Math.PI / 4) // -45 degrees
    
    const textWidth = ctx.measureText(watermarkText).width + scaledFontSize
    const diagonal = Math.sqrt(Math.pow(canvas.width, 2) + Math.pow(canvas.height, 2))
    
    const countX = Math.ceil(diagonal / textWidth) * 2
    const countY = Math.ceil(diagonal / (scaledFontSize * 3)) * 2
    
    for (let i = -countX; i < countX; i++) {
       for (let j = -countY; j < countY; j++) {
          ctx.fillText(watermarkText, i * textWidth, j * (scaledFontSize * 3))
       }
    }
    ctx.restore()
    
    setPreviewSrc(canvas.toDataURL('image/jpeg', 0.9))
  }, [imgObj, imageSrc, watermarkText, watermarkColor, watermarkOpacity, watermarkSize])

  React.useEffect(() => {
     if (imgObj) {
        // Debounce slightly to prevent lag on slider changes
        const timer = setTimeout(() => {
            applyWatermark()
        }, 100)
        return () => clearTimeout(timer)
     }
  }, [imgObj, applyWatermark])

  const handleDownload = () => {
    if (!previewSrc) return
    const link = document.createElement("a")
    link.download = `${originalName}-watermarked.jpg`
    link.href = previewSrc
    link.click()
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TextAa className="text-primary" /> Watermark Adder
          </CardTitle>
          <CardDescription>Secure your images instantly by adding tiled text watermarks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <input 
             type="file" 
             accept="image/*" 
             ref={fileInputRef}
             className="hidden" 
             onChange={handleFileUpload} 
          />
          <canvas ref={canvasRef} className="hidden" />

          {!imageSrc ? (
             <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-16 text-center cursor-pointer hover:bg-muted/50 transition-colors"
             >
                <div className="flex flex-col items-center justify-center text-muted-foreground gap-4">
                   <UploadSimple size={48} className="opacity-50" />
                   <div>
                      <p className="font-semibold text-foreground">Upload Image to Watermark</p>
                      <p className="text-sm mt-1">Processed natively in your browser.</p>
                   </div>
                </div>
             </div>
          ) : (
             <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
                
                {/* Controls Sidebar */}
                <div className="bg-card w-full rounded-xl border shadow-sm p-5 space-y-6">
                   <div className="space-y-4">
                      
                      <div className="space-y-2">
                        <Label>Watermark Text</Label>
                        <Input 
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          placeholder="e.g. © 2026 Kraaft"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Color</Label>
                        <Input 
                          type="color"
                          value={watermarkColor}
                          onChange={(e) => setWatermarkColor(e.target.value)}
                          className="h-10 px-2 flex-1 w-full"
                        />
                      </div>

                      <div className="space-y-2">
                         <div className="flex justify-between">
                            <Label>Opacity</Label>
                            <span className="text-xs text-muted-foreground">{Math.round(parseFloat(watermarkOpacity) * 100)}%</span>
                         </div>
                         <input 
                            type="range" 
                            min="0.05" max="1.0" step="0.05"
                            value={watermarkOpacity}
                            onChange={(e) => setWatermarkOpacity(e.target.value)}
                            className="w-full accent-primary h-2 bg-muted rounded-full appearance-none cursor-pointer"
                         />
                      </div>

                      <div className="space-y-2">
                         <div className="flex justify-between">
                            <Label>Font Scale</Label>
                            <span className="text-xs text-muted-foreground">{watermarkSize}</span>
                         </div>
                         <input 
                            type="range" 
                            min="10" max="150" step="1"
                            value={watermarkSize}
                            onChange={(e) => setWatermarkSize(e.target.value)}
                            className="w-full accent-primary h-2 bg-muted rounded-full appearance-none cursor-pointer"
                         />
                      </div>

                   </div>

                   <div className="pt-4 space-y-3 border-t">
                      <Button onClick={handleDownload} className="w-full shadow-md" size="lg">
                         <DownloadSimple className="mr-2" size={20} /> Download Result
                      </Button>
                      <Button variant="outline" className="w-full text-xs" onClick={() => {setImageSrc(null); setPreviewSrc(null)}}>
                         <ImageIcon className="mr-2" /> Start Over
                      </Button>
                   </div>
                </div>

                {/* Preview Area */}
                <div className="bg-muted/30 border rounded-xl p-4 flex flex-col items-center justify-center relative min-h-[400px]">
                   {previewSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewSrc} alt="Preview" className="max-h-[600px] object-contain rounded shadow-lg" />
                   ) : (
                      <div className="animate-pulse flex items-center justify-center text-muted-foreground">Rendering watermark...</div>
                   )}
                </div>

             </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
