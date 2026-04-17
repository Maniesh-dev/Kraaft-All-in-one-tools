"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { FileImage, DownloadSimple, UploadSimple, Image as ImageIcon } from "@phosphor-icons/react"
import { Label } from "@workspace/ui/components/label"

export function ImageFormatConverterTool() {
  const [imageSrc, setImageSrc] = React.useState<string | null>(null)
  const [originalName, setOriginalName] = React.useState("")
  const [selectedFormat, setSelectedFormat] = React.useState("image/webp")
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setOriginalName(file.name.split('.')[0] || "image")
    const reader = new FileReader()
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDownload = () => {
    if (!imageSrc || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      
      // Fill background for transparent images converting to JPG
      if (selectedFormat === 'image/jpeg') {
         ctx!.fillStyle = '#FFFFFF'
         ctx!.fillRect(0, 0, canvas.width, canvas.height)
      }
      
      ctx!.drawImage(img, 0, 0)
      
      const ext = selectedFormat.split('/')[1]
      const outName = `${originalName}-converted.${ext}`
      
      const convertedUrl = canvas.toDataURL(selectedFormat, 0.92)
      
      const link = document.createElement("a")
      link.download = outName
      link.href = convertedUrl
      link.click()
    }
    img.src = imageSrc
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="text-primary" /> Image Format Converter
          </CardTitle>
          <CardDescription>Convert images quickly between PNG, JPG, WebP securely in your browser.</CardDescription>
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
                      <p className="font-semibold text-foreground">Click to upload an image</p>
                      <p className="text-sm mt-1">Supports PNG, JPG, WebP, GIF</p>
                   </div>
                </div>
             </div>
          ) : (
             <div className="space-y-6">
                <div className="flex flex-col items-center justify-center p-6 bg-muted/20 border rounded-xl">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img src={imageSrc} alt="Preview" className="max-h-[300px] object-contain rounded-lg shadow-sm" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end bg-card border shadow-sm p-4 rounded-xl">
                   <div className="space-y-2">
                      <Label>Target Format</Label>
                      <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                         <SelectTrigger className="w-full">
                            <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                            <SelectItem value="image/png">PNG</SelectItem>
                            <SelectItem value="image/jpeg">JPEG (JPG)</SelectItem>
                            <SelectItem value="image/webp">WebP</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                   <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setImageSrc(null)}>
                         <ImageIcon className="mr-2" /> Replace
                      </Button>
                      <Button onClick={handleDownload} className="px-8 shadow-md">
                         <DownloadSimple className="mr-2" /> Convert & Download
                      </Button>
                   </div>
                </div>
                
                <p className="text-xs text-center text-muted-foreground pt-4">
                   All conversions happen completely offline right inside your local machine. No data is uploaded to any servers.
                </p>
             </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
