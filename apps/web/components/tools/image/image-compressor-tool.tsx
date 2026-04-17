"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { ArrowsInLineHorizontal, DownloadSimple, UploadSimple, Image as ImageIcon } from "@phosphor-icons/react"
import { Label } from "@workspace/ui/components/label"

export function ImageCompressorTool() {
  const [imageSrc, setImageSrc] = React.useState<string | null>(null)
  const [originalName, setOriginalName] = React.useState("")
  const [originalSize, setOriginalSize] = React.useState(0)
  const [compressedSrc, setCompressedSrc] = React.useState<string | null>(null)
  const [compressedSize, setCompressedSize] = React.useState(0)
  const [quality, setQuality] = React.useState("0.8")
  
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setOriginalSize(file.size)
    setOriginalName(file.name.split('.')[0] || "image")
    const reader = new FileReader()
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCompress = React.useCallback(() => {
    if (!imageSrc || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      
      // Draw background white to avoid black transparency on jpeg
      ctx!.fillStyle = '#FFFFFF'
      ctx!.fillRect(0, 0, canvas.width, canvas.height)
      ctx!.drawImage(img, 0, 0)
      
      const compressedDataUrl = canvas.toDataURL('image/jpeg', parseFloat(quality))
      setCompressedSrc(compressedDataUrl)
      
      // Calculate approximate size in bytes from base64 (string length * 3/4)
      const base64Length = compressedDataUrl.length - (compressedDataUrl.indexOf(',') + 1)
      const padding = (compressedDataUrl.endsWith('==') ? 2 : 1)
      const approxBytes = (base64Length * 3 / 4) - padding
      setCompressedSize(Math.max(0, approxBytes))
    }
    img.src = imageSrc
  }, [imageSrc, quality])

  // Re-compress when quality changes
  React.useEffect(() => {
     if (imageSrc) handleCompress()
  }, [quality, handleCompress, imageSrc])

  const formatBytes = (bytes: number) => {
     if (bytes === 0) return '0 Bytes';
     const k = 1024;
     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
     const i = Math.floor(Math.log(bytes) / Math.log(k));
     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  const handleDownload = () => {
    if (!compressedSrc) return
    const link = document.createElement("a")
    link.download = `${originalName}-compressed.jpg`
    link.href = compressedSrc
    link.click()
  }

  const compressionRatio = originalSize > 0 
    ? Math.round((1 - (compressedSize / originalSize)) * 100) 
    : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowsInLineHorizontal className="text-primary" /> Image Compressor
          </CardTitle>
          <CardDescription>Reduce image file sizes instantly without server uploads.</CardDescription>
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
                      <p className="font-semibold text-foreground">Drop an image here or click</p>
                      <p className="text-sm mt-1">PNG, JPG, WebP supported for size reduction.</p>
                   </div>
                </div>
             </div>
          ) : (
             <div className="space-y-8">
                
                <div className="bg-card border shadow-sm p-5 rounded-xl space-y-4">
                   <div className="flex justify-between items-center">
                      <Label className="text-base font-semibold tracking-wide">Compression Level</Label>
                      <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
                         {Math.round(parseFloat(quality) * 100)}% Quality
                      </span>
                   </div>
                   
                   <input 
                      type="range" 
                      min="0.1" max="1.0" step="0.05"
                      value={quality}
                      onChange={(e) => setQuality(e.target.value)}
                      className="w-full accent-primary h-2 bg-muted rounded-full appearance-none cursor-pointer"
                   />
                   
                   <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Maximum Compression (Smaller Size)</span>
                      <span>High Quality (Larger Size)</span>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2 border rounded-xl overflow-hidden bg-muted/10 relative pb-10">
                      <div className="bg-muted px-3 py-2 text-sm font-bold flex justify-between">
                         <span>Original</span>
                         <span className="text-muted-foreground">{formatBytes(originalSize)}</span>
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageSrc} alt="Original" className="w-full object-contain max-h-[300px] p-2" />
                   </div>
                   
                   <div className="space-y-2 border rounded-xl overflow-hidden bg-muted/10 relative pb-14">
                      <div className="bg-primary/20 text-primary px-3 py-2 text-sm font-bold flex justify-between">
                         <span>Compressed</span>
                         <span className="text-primary">{formatBytes(compressedSize)}</span>
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={compressedSrc!} alt="Compressed" className="w-full object-contain max-h-[300px] p-2" />
                      
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-background/80 backdrop-blur-sm border-t flex justify-between items-center">
                         <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                            Saved {compressionRatio}%
                         </div>
                         <Button size="sm" onClick={handleDownload} className="shadow-md">
                            <DownloadSimple className="mr-2" /> Save Image
                         </Button>
                      </div>
                   </div>
                </div>

                <div className="flex justify-center">
                   <Button variant="outline" onClick={() => setImageSrc(null)}>
                      <ImageIcon className="mr-2" /> Compress Another Image
                   </Button>
                </div>

             </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
