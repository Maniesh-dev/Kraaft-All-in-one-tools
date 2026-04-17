"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { MapPin, Code, Copy, CheckCircle, SpinnerGap } from "@phosphor-icons/react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"

export function WeatherWidgetTool() {
  const [city, setCity] = React.useState("London")
  const [theme, setTheme] = React.useState("dark")
  const [size, setSize] = React.useState("large")
  const [loading, setLoading] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [error, setError] = React.useState("")

  const [widgetLat, setWidgetLat] = React.useState<number>(51.5085)
  const [widgetLng, setWidgetLng] = React.useState<number>(-0.1257)
  const [widgetName, setWidgetName] = React.useState("London")

  const fetchCoordinates = async (query: string) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`)
      const [first] = await res.json()
      if (first) {
        return { lat: parseFloat(first.lat), lng: parseFloat(first.lon), name: first.display_name.split(',')[0] }
      }
      return null
    } catch {
      return null
    }
  }

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!city.trim()) return

    setLoading(true)
    setError("")

    const coords = await fetchCoordinates(city)
    if (coords) {
      setWidgetName(coords.name)
      setWidgetLat(coords.lat)
      setWidgetLng(coords.lng)
    } else {
      setError("Could not find location.")
    }
    setLoading(false)
  }

  const geolocate = () => {
    if ("geolocation" in navigator) {
      setLoading(true)
      setError("")
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setWidgetName("Your Location")
          setWidgetLat(position.coords.latitude)
          setWidgetLng(position.coords.longitude)
          setCity("Your Location")
          setLoading(false)
        },
        () => {
          setError("Could not access your location.")
          setLoading(false)
        }
      )
    }
  }

  // Generate an embed iframe pointing to Open Meteo's free embed widget
  const height = size === "small" ? "200" : size === "medium" ? "300" : "400"
  const themeParam = theme === "dark" ? "&theme=dark" : "&theme=light"
  const iframeSrc = `https://open-meteo.com/en/widget/weather?latitude=${widgetLat}&longitude=${widgetLng}&name=${encodeURIComponent(widgetName)}&language=en${themeParam}`
  
  const embedCode = `<iframe 
  src="${iframeSrc}" 
  width="100%" 
  height="${height}" 
  style="border: none; border-radius: 8px;"
></iframe>`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(embedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Widget Settings</CardTitle>
            <CardDescription>Configure the appearance and location of your weather widget.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-1.5 w-full">
                <Label>Location</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="e.g. New York, Tokyo" 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                  <Button type="submit" disabled={loading || !city.trim()}>
                    {loading ? <SpinnerGap className="animate-spin" /> : "Set"}
                  </Button>
                </div>
              </div>
              <div className="flex items-center pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={geolocate}>
                  <MapPin data-icon="inline-start" /> Use my current location
                </Button>
              </div>
            </form>

            <div className="space-y-4 pt-4 border-t">
               <div className="space-y-1.5 w-full">
                 <Label>Theme</Label>
                 <Select value={theme} onValueChange={setTheme}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="dark">Dark Theme</SelectItem>
                     <SelectItem value="light">Light Theme</SelectItem>
                   </SelectContent>
                 </Select>
               </div>

               <div className="space-y-1.5 w-full">
                 <Label>Size (Height)</Label>
                 <Select value={size} onValueChange={setSize}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="large">Large (400px)</SelectItem>
                     <SelectItem value="medium">Medium (300px)</SelectItem>
                     <SelectItem value="small">Small (200px)</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card>
            <CardHeader className="py-4 bg-muted/30">
              <CardTitle className="text-sm uppercase tracking-widest font-semibold flex items-center gap-2">
                <Code /> Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden">
               {error ? (
                  <div className="p-4 text-destructive text-sm text-center font-medium my-4">{error}</div>
               ) : (
                  <iframe 
                    key={iframeSrc + height} // Force remount on change
                    src={iframeSrc} 
                    width="100%" 
                    height={height} 
                    className="border-none"
                    title="Weather Preview"
                  />
               )}
            </CardContent>
          </Card>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Embed Code</Label>
              <Button size="sm" variant="outline" onClick={copyToClipboard} className="h-8">
                {copied ? <CheckCircle className="text-green-500" /> : <Copy />}
                {copied ? "Copied!" : "Copy HTML"}
              </Button>
            </div>
            <pre className="p-4 rounded-lg bg-muted text-xs font-mono overflow-x-auto border">
              <code>{embedCode}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
