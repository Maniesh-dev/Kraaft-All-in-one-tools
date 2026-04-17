"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Eyedropper, UploadSimple, Image as ImageIcon, Copy } from "@phosphor-icons/react"
import { toast } from "sonner"

function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

export function ColorPickerImageTool() {
  const [imageSrc, setImageSrc] = React.useState<string | null>(null)
  
  const [hoverColor, setHoverColor] = React.useState<{ r: number, g: number, b: number } | null>(null)
  const [pickedColors, setPickedColors] = React.useState<{ hex: string, rgb: string }[]>([])
  
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const imgRef = React.useRef<HTMLImageElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string)
      setPickedColors([])
    }
    reader.readAsDataURL(file)
  }

  const getPixelData = (e: React.MouseEvent<HTMLImageElement> | React.TouchEvent<HTMLImageElement>) => {
     if (!imgRef.current || !canvasRef.current) return null
     
     const img = imgRef.current
     const canvas = canvasRef.current
     const ctx = canvas.getContext('2d', { willReadFrequently: true })
     if (!ctx) return null

     // Ensure canvas matches image dimensions exactly for coordinate accuracy
     if (canvas.width !== img.naturalWidth) {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        ctx.drawImage(img, 0, 0)
     }

     const rect = img.getBoundingClientRect()
     
     // Handle both mouse and touch
     let clientX, clientY;
     if ('touches' in e) {
        clientX = e.touches[0]!.clientX
        clientY = e.touches[0]!.clientY
     } else {
        clientX = (e as React.MouseEvent).clientX
        clientY = (e as React.MouseEvent).clientY
     }

     const x = clientX - rect.left
     const y = clientY - rect.top

     // Scale coordinates from rendered size to natural size
     const scaleX = img.naturalWidth / rect.width
     const scaleY = img.naturalHeight / rect.height
     
     const actualX = Math.round(x * scaleX)
     const actualY = Math.round(y * scaleY)

     if (actualX >= 0 && actualX < canvas.width && actualY >= 0 && actualY < canvas.height) {
        const pixel = ctx.getImageData(actualX, actualY, 1, 1).data
        return { r: pixel[0]!, g: pixel[1]!, b: pixel[2]! }
     }
     return null
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
     const color = getPixelData(e)
     setHoverColor(color)
  }

  const handleClick = (e: React.MouseEvent<HTMLImageElement>) => {
     const color = getPixelData(e)
     if (color) {
        const hex = rgbToHex(color.r, color.g, color.b)
        const rgb = `rgb(${color.r}, ${color.g}, ${color.b})`
        
        // Prevent duplicates in sequence
        setPickedColors(prev => {
           if (prev.length > 0 && prev[0]?.hex === hex) return prev;
           return [{ hex, rgb }, ...prev].slice(0, 10) // keep last 10
        })
     }
  }

  const handleTouch = (e: React.TouchEvent<HTMLImageElement>) => {
     e.preventDefault() // prevent scrolling
     const color = getPixelData(e)
     setHoverColor(color)
     // Touch counts as click here for simplicity, or we let them release
  }

  const copyToClipboard = (text: string) => {
     navigator.clipboard.writeText(text)
     toast.success(`${text} copied to clipboard!`)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eyedropper className="text-primary" /> Color Picker from Image
          </CardTitle>
          <CardDescription>Hover and click over any photo to extract precise HEX and RGB coordinates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <input 
             type="file" 
             accept="image/*" 
             ref={fileInputRef}
             className="hidden" 
             onChange={handleFileUpload} 
          />
          {/* Secret canvas for parsing pixels */}
          <canvas ref={canvasRef} className="hidden" />

          {!imageSrc ? (
             <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-16 text-center cursor-pointer hover:bg-muted/50 transition-colors"
             >
                <div className="flex flex-col items-center justify-center text-muted-foreground gap-4">
                   <UploadSimple size={48} className="opacity-50" />
                   <div>
                      <p className="font-semibold text-foreground">Upload Image to extract colors</p>
                      <p className="text-sm mt-1">Natively picks specific pixel buffers without uploading.</p>
                   </div>
                </div>
             </div>
          ) : (
             <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
                
                {/* Image Stage Area */}
                <div className="bg-muted/30 border rounded-xl p-4 flex flex-col items-center justify-center relative relative min-h-[400px] overflow-hidden group">
                   
                   {/* Tooltip Hover Display */}
                   {hoverColor && (
                      <div className="absolute top-4 left-4 flex items-center gap-3 bg-background/90 backdrop-blur-sm border shadow-lg rounded-lg p-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                         <div 
                           className="size-8 rounded-md border shadow-inner" 
                           style={{ backgroundColor: `rgb(${hoverColor.r}, ${hoverColor.g}, ${hoverColor.b})` }}
                         />
                         <div className="text-xs font-mono font-bold leading-tight">
                            {rgbToHex(hoverColor.r, hoverColor.g, hoverColor.b).toUpperCase()}<br/>
                            <span className="text-muted-foreground font-normal">rgb({hoverColor.r}, {hoverColor.g}, {hoverColor.b})</span>
                         </div>
                      </div>
                   )}

                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img 
                      ref={imgRef}
                      src={imageSrc} 
                      alt="Source" 
                      crossOrigin="anonymous"
                      onMouseMove={handleMouseMove}
                      onMouseLeave={() => setHoverColor(null)}
                      onClick={handleClick}
                      onTouchMove={handleTouch}
                      className="max-h-[600px] object-contain cursor-crosshair drop-shadow-md rounded" 
                   />
                </div>

                {/* Extracted Colors Sidebar */}
                <div className="bg-card w-full rounded-xl border shadow-sm flex flex-col min-h-[400px]">
                   <div className="p-4 border-b bg-muted/20 flex justify-between items-center">
                      <h3 className="font-bold">Palette History</h3>
                      <Button variant="ghost" size="sm" onClick={() => setImageSrc(null)} className="h-8 px-2 text-xs">
                         <ImageIcon className="mr-1" /> New
                      </Button>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {pickedColors.length === 0 ? (
                         <div className="text-center text-sm text-muted-foreground mt-10 p-4 border border-dashed rounded-lg bg-muted/10">
                            Click anywhere on the image to capture colors here.
                         </div>
                      ) : (
                         pickedColors.map((pc, i) => (
                            <div key={i} className="flex items-center gap-3 border rounded-lg p-2 bg-card shadow-sm group">
                               <div 
                                 className="size-10 rounded-md border shadow-inner shrink-0" 
                                 style={{ backgroundColor: pc.hex }}
                               />
                               <div className="flex-1 overflow-hidden">
                                  <div className="font-mono text-sm font-bold truncate">{pc.hex.toUpperCase()}</div>
                                  <div className="font-mono text-[10px] text-muted-foreground truncate">{pc.rgb}</div>
                               </div>
                               <Button variant="ghost" size="icon" onClick={() => copyToClipboard(pc.hex.toUpperCase())} className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-foreground">
                                  <Copy size={16} />
                               </Button>
                            </div>
                         ))
                      )}
                   </div>
                </div>

             </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
