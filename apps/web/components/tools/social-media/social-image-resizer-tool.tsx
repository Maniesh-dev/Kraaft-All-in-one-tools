"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { UploadSimple, DownloadSimple, InstagramLogo, TwitterLogo, FacebookLogo, YoutubeLogo, Image as ImageIcon } from "@phosphor-icons/react"
import { Label } from "@workspace/ui/components/label"
import { Input } from "@workspace/ui/components/input"

const TEMPLATES = [
  { id: "ig-square", name: "Instagram Square Post", width: 1080, height: 1080, icon: <InstagramLogo className="text-pink-500 mr-2" /> },
  { id: "ig-portrait", name: "Instagram Portrait", width: 1080, height: 1350, icon: <InstagramLogo className="text-pink-500 mr-2" /> },
  { id: "ig-story", name: "Instagram Story / Reels", width: 1080, height: 1920, icon: <InstagramLogo className="text-pink-500 mr-2" /> },
  { id: "tw-post", name: "Twitter / X Post", width: 1200, height: 675, icon: <TwitterLogo className="text-blue-400 mr-2" /> },
  { id: "tw-header", name: "Twitter / X Header", width: 1500, height: 500, icon: <TwitterLogo className="text-blue-400 mr-2" /> },
  { id: "yt-thumbnail", name: "YouTube Thumbnail", width: 1280, height: 720, icon: <YoutubeLogo className="text-red-500 mr-2" /> },
  { id: "yt-banner", name: "YouTube Channel Banner", width: 2560, height: 1440, icon: <YoutubeLogo className="text-red-500 mr-2" /> },
  { id: "fb-post", name: "Facebook Post", width: 1200, height: 630, icon: <FacebookLogo className="text-blue-600 mr-2" /> },
  { id: "fb-cover", name: "Facebook Cover", width: 820, height: 312, icon: <FacebookLogo className="text-blue-600 mr-2" /> },
]

export function SocialImageResizerTool() {
  const [imageSrc, setImageSrc] = React.useState<string | null>(null)
  const [originalName, setOriginalName] = React.useState("")
  const [imgObj, setImgObj] = React.useState<HTMLImageElement | null>(null)
  
  const [selectedTemplate, setSelectedTemplate] = React.useState(TEMPLATES[0]!.id)
  const [fitMode, setFitMode] = React.useState<"cover" | "contain">("cover")
  const [bgColor, setBgColor] = React.useState("#ffffff")
  
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  const activeT = TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[0]!

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

  const renderPreview = React.useCallback(() => {
    if (!imgObj || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const tw = activeT.width
    const th = activeT.height
    
    // Virtual drawing for preview scaling (CSS handles visual scaling, canvas handles raw output)
    canvas.width = tw
    canvas.height = th
    
    // Draw background
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, tw, th)
    
    // Draw Image
    const iw = imgObj.width
    const ih = imgObj.height

    const iratio = iw / ih
    const tratio = tw / th

    let drawW = tw
    let drawH = th
    let offsetX = 0
    let offsetY = 0

    if (fitMode === "cover") {
       if (iratio > tratio) {
          drawH = th
          drawW = th * iratio
          offsetX = (tw - drawW) / 2
       } else {
          drawW = tw
          drawH = tw / iratio
          offsetY = (th - drawH) / 2
       }
    } else { // contain
       if (iratio > tratio) {
          drawW = tw
          drawH = tw / iratio
          offsetY = (th - drawH) / 2
       } else {
          drawH = th
          drawW = th * iratio
          offsetX = (tw - drawW) / 2
       }
    }

    ctx.drawImage(imgObj, offsetX, offsetY, drawW, drawH)
  }, [imgObj, activeT, fitMode, bgColor])

  React.useEffect(() => {
     renderPreview()
  }, [renderPreview])


  const handleDownload = () => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const outName = `${originalName}-${activeT.id}.jpg`
    const convertedUrl = canvas.toDataURL('image/jpeg', 0.95)
    
    const link = document.createElement("a")
    link.download = outName
    link.href = convertedUrl
    link.click()
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <InstagramLogo className="text-primary" /> Social Image Resizer
          </CardTitle>
          <CardDescription>Instantly format your pictures natively to fit perfectly across all social media networks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <input 
             type="file" 
             accept="image/*" 
             ref={fileInputRef}
             className="hidden" 
             onChange={handleFileUpload} 
          />
          
          {/* Working Canvas (hidden visually but mapped into dataURL later) */}
          <canvas ref={canvasRef} className="hidden" />

          {!imageSrc ? (
             <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-16 text-center cursor-pointer hover:bg-muted/50 transition-colors"
             >
                <div className="flex flex-col items-center justify-center text-muted-foreground gap-4">
                   <UploadSimple size={48} className="opacity-50" />
                   <div>
                      <p className="font-semibold text-foreground">Click or Drop your photo here.</p>
                      <p className="text-sm mt-1">Processed natively offline.</p>
                   </div>
                </div>
             </div>
          ) : (
             <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-start relative">
                
                {/* Visual Preview Window */}
                <div className="bg-muted/30 border rounded-xl overflow-hidden shadow-inner flex items-center justify-center relative min-h-[500px]">
                   
                   {/* CSS-based representation of the canvas for visual fluidness without lag */}
                   <div 
                      className="relative overflow-hidden shadow-2xl transition-all duration-300 ease-in-out border border-white/20"
                      style={{ 
                         aspectRatio: `${activeT.width} / ${activeT.height}`,
                         maxHeight: "450px",
                         maxWidth: "100%",
                         backgroundColor: bgColor
                      }}
                   >
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                     <img 
                       src={imageSrc} 
                       alt="Preview"
                       className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                       style={{
                          width: fitMode === "cover" ? "100%" : "auto",
                          height: fitMode === "cover" ? "100%" : "auto",
                          maxWidth: fitMode === "contain" ? "100%" : "none",
                          maxHeight: fitMode === "contain" ? "100%" : "none",
                          objectFit: fitMode
                       }}
                     />
                   </div>

                   <div className="absolute top-3 right-3 bg-background/90 backdrop-blur text-foreground px-3 py-1 rounded-md text-xs font-bold shadow opacity-80 select-none">
                      {activeT.width} × {activeT.height} px
                   </div>
                </div>

                {/* Configuration Sidebar */}
                <div className="space-y-6">
                   <div className="bg-card p-5 border rounded-xl shadow-sm space-y-5">
                      
                      <div className="space-y-2">
                        <Label>Platform Template</Label>
                        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                           <SelectTrigger className="w-full font-semibold">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              {TEMPLATES.map(t => (
                                 <SelectItem key={t.id} value={t.id}>
                                    <div className="flex items-center">
                                       {t.icon} {t.name}
                                    </div>
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3 pt-2">
                         <Label>Scaling Mode</Label>
                         <div className="grid grid-cols-2 gap-2">
                            <Button 
                              variant={fitMode === "cover" ? "default" : "outline"} 
                              onClick={() => setFitMode("cover")}
                              className="text-xs"
                            >
                               Fill Area (Crop)
                            </Button>
                            <Button 
                              variant={fitMode === "contain" ? "default" : "outline"} 
                              onClick={() => setFitMode("contain")}
                              className="text-xs"
                            >
                               Fit Inside (Padding)
                            </Button>
                         </div>
                      </div>

                      {fitMode === "contain" && (
                         <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2">
                            <Label>Padding Background Color</Label>
                            <div className="flex gap-2">
                               <Input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-10 h-10 p-1" />
                               <Input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} className="font-mono text-sm uppercase flex-1" />
                            </div>
                         </div>
                      )}

                   </div>
                   
                   <div className="space-y-3">
                      <Button onClick={handleDownload} className="w-full shadow-md" size="lg">
                         <DownloadSimple className="mr-2" size={20} /> Generate Ready Image
                      </Button>
                      <Button variant="outline" className="w-full" onClick={() => setImageSrc(null)}>
                         <ImageIcon className="mr-2" /> Upload Another
                      </Button>
                   </div>
                </div>

             </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
