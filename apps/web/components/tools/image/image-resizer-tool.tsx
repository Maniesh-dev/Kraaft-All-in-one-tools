"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { CornersOut, DownloadSimple, UploadSimple, Image as ImageIcon, Link as LinkIcon, LinkBreak } from "@phosphor-icons/react"
import { Label } from "@workspace/ui/components/label"

export function ImageResizerTool() {
  const [imageSrc, setImageSrc] = React.useState<string | null>(null)
  const [originalName, setOriginalName] = React.useState("")
  const [imgObj, setImgObj] = React.useState<HTMLImageElement | null>(null)
  
  const [width, setWidth] = React.useState(0)
  const [height, setHeight] = React.useState(0)
  const [lockRatio, setLockRatio] = React.useState(true)
  
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
         setWidth(img.width)
         setHeight(img.height)
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  const handleWidthChange = (val: string) => {
    const w = parseInt(val, 10) || 0
    setWidth(w)
    if (lockRatio && imgObj) {
      setHeight(Math.round((w / imgObj.width) * imgObj.height))
    }
  }

  const handleHeightChange = (val: string) => {
    const h = parseInt(val, 10) || 0
    setHeight(h)
    if (lockRatio && imgObj) {
      setWidth(Math.round((h / imgObj.height) * imgObj.width))
    }
  }

  const handleDownload = () => {
    if (!imgObj || !canvasRef.current || width === 0 || height === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    
    canvas.width = width
    canvas.height = height
    
    // Draw scaled
    ctx!.drawImage(imgObj, 0, 0, width, height)
    
    // Download
    const convertedUrl = canvas.toDataURL('image/png')
    const link = document.createElement("a")
    link.download = `${originalName}-${width}x${height}.png`
    link.href = convertedUrl
    link.click()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CornersOut className="text-primary" /> Image Resizer
          </CardTitle>
          <CardDescription>Resize images precisely by pixels while maintaining aspect ratio.</CardDescription>
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
                      <p className="font-semibold text-foreground">Click or Drag & Drop an image</p>
                      <p className="text-sm mt-1">Native browser resizing. No server uploads.</p>
                   </div>
                </div>
             </div>
          ) : (
             <div className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
                   
                   {/* Preview Area */}
                   <div className="bg-muted/10 border rounded-xl p-4 flex flex-col items-center justify-center relative min-h-[300px]">
                      <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold shadow-sm opacity-70">
                         Original: {imgObj?.width} x {imgObj?.height}
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageSrc} alt="Preview" className="max-h-[400px] object-contain rounded drop-shadow-md" />
                   </div>

                   {/* Controls */}
                   <div className="bg-card w-full md:w-[320px] rounded-xl border shadow-sm p-6 space-y-6">
                      <div className="space-y-4">
                         <h3 className="font-bold border-b pb-2">Resize Settings</h3>
                         
                         <div className="space-y-2">
                           <Label>Width (px)</Label>
                           <Input 
                             type="number" 
                             value={width || ""}
                             onChange={(e) => handleWidthChange(e.target.value)}
                             className="text-lg font-mono"
                           />
                         </div>

                         <div className="flex justify-center -my-2">
                            <Button 
                               variant="ghost" 
                               size="icon" 
                               className="rounded-full shadow-sm bg-muted text-muted-foreground hover:text-primary z-10 hover:bg-primary/10"
                               onClick={() => setLockRatio(!lockRatio)}
                               title={lockRatio ? "Unlock aspect ratio" : "Lock aspect ratio"}
                            >
                               {lockRatio ? <LinkIcon weight="bold" /> : <LinkBreak weight="bold" />}
                            </Button>
                         </div>

                         <div className="space-y-2">
                           <Label>Height (px)</Label>
                           <Input 
                             type="number" 
                             value={height || ""}
                             onChange={(e) => handleHeightChange(e.target.value)}
                             className="text-lg font-mono"
                           />
                         </div>
                      </div>

                      <div className="pt-4 space-y-3 border-t">
                         <Button onClick={handleDownload} className="w-full shadow-md" size="lg">
                            <DownloadSimple className="mr-2" size={20} /> Resize & Download
                         </Button>
                         <Button variant="outline" className="w-full" onClick={() => setImageSrc(null)}>
                            <ImageIcon className="mr-2" /> Choose Different Image
                         </Button>
                      </div>
                   </div>

                </div>

             </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
