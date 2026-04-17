"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { MapPin, Sun, Sunglasses, Umbrella, ShieldWarning, SpinnerGap } from "@phosphor-icons/react"

interface UvData {
  time: string[]
  uv_index_max: number[]
}

const getUvInfo = (uv: number) => {
  if (uv <= 2.9) return { level: "Low", color: "text-green-500", bg: "bg-green-500/10", icon: Sun, tip: "No protection needed. You can safely stay outside." }
  if (uv <= 5.9) return { level: "Moderate", color: "text-yellow-500", bg: "bg-yellow-500/10", icon: Sunglasses, tip: "Protection required. Seek shade during midday hours." }
  if (uv <= 7.9) return { level: "High", color: "text-orange-500", bg: "bg-orange-500/10", icon: Umbrella, tip: "Protection essential. Reduce time in the sun between 10 a.m. and 4 p.m." }
  if (uv <= 10.9) return { level: "Very High", color: "text-red-500", bg: "bg-red-500/10", icon: ShieldWarning, tip: "Extra protection needed. Minimize sun exposure." }
  return { level: "Extreme", color: "text-purple-600", bg: "bg-purple-600/10", icon: ShieldWarning, tip: "Take all precautions! Unprotected skin can burn in minutes." }
}

export function UvIndexTool() {
  const [city, setCity] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [data, setData] = React.useState<UvData | null>(null)
  const [error, setError] = React.useState("")
  const [locationName, setLocationName] = React.useState("")

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

  const fetchUv = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=uv_index_max&timezone=auto`)
      const json = await res.json()
      if (json.daily) {
        setData(json.daily)
        setError("")
      } else {
        setError("Could not fetch UV data.")
      }
    } catch {
      setError("An error occurred while fetching UV index.")
    }
  }

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!city.trim()) return

    setLoading(true)
    setError("")
    setData(null)

    const coords = await fetchCoordinates(city)
    if (coords) {
      setLocationName(coords.name)
      await fetchUv(coords.lat, coords.lng)
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
        async (position) => {
          setLocationName("Your Location")
          await fetchUv(position.coords.latitude, position.coords.longitude)
          setCity("")
          setLoading(false)
        },
        () => {
          setError("Could not access your location.")
          setLoading(false)
        }
      )
    }
  }

  const todayUv = data?.uv_index_max[0] ?? 0
  const uvInfo = getUvInfo(todayUv)
  const Icon = uvInfo.icon

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>UV Index Checker</CardTitle>
          <CardDescription>Check the max UV index and stay sun safe.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1 space-y-1.5 w-full">
                <Label>City or Location</Label>
                <Input
                  placeholder="e.g. Miami, Sydney"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading || !city.trim()} className="w-full sm:w-auto">
                {loading ? <SpinnerGap className="animate-spin" /> : "Search"}
              </Button>
            </div>
            <div className="flex items-center justify-center pt-2">
              <Button type="button" variant="ghost" onClick={geolocate}>
                <MapPin data-icon="inline-start" /> Use my current location
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm text-center font-medium">
          {error}
        </div>
      )}

      {data && (
        <Card className={`border-2 animate-in fade-in zoom-in-95 ${uvInfo.color.replace('text', 'border')}/20`}>
          <CardContent className="p-0">
            <div className={`p-8 md:p-12 flex flex-col items-center justify-center text-center gap-4 ${uvInfo.bg}`}>
              <h2 className="text-xl font-medium tracking-tight opacity-80">{locationName} - Today</h2>
              <div className={`text-8xl font-bold font-mono tracking-tighter ${uvInfo.color}`}>
                {todayUv.toFixed(1)}
              </div>
              <div className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest bg-background drop-shadow-sm flex items-center gap-2 ${uvInfo.color}`}>
                <Icon weight="duotone" className="size-4" />
                {uvInfo.level}
              </div>
              <p className="max-w-xs text-sm font-medium opacity-90 mt-2">{uvInfo.tip}</p>
            </div>

            <div className="p-4 bg-muted/30">
              <p className="text-sm font-semibold mb-4 text-center">Next 6 Days</p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {data.time.slice(1, 7).map((dateStr, i) => {
                  const u = data.uv_index_max[i + 1] ?? 0
                  const innerInfo = getUvInfo(u)
                  const date = new Date(dateStr)
                  const day = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date)
                  return (
                    <div key={dateStr} className={`p-2 rounded-lg text-center flex flex-col items-center gap-1 border border-transparent hover:border-border transition-colors`}>
                      <p className="text-xs text-muted-foreground">{day}</p>
                      <p className={`font-mono font-bold ${innerInfo.color}`}>{u.toFixed(1)}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
