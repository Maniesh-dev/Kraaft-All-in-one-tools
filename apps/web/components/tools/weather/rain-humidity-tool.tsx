"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { MapPin, Drop, CloudRain, SpinnerGap } from "@phosphor-icons/react"

interface RainData {
  current: {
    relative_humidity_2m: number
    precipitation: number
  }
  daily: {
    time: string[]
    precipitation_sum: number[]
    precipitation_probability_max: number[]
  }
}

export function RainHumidityTool() {
  const [city, setCity] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [data, setData] = React.useState<RainData | null>(null)
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

  const fetchRain = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=relative_humidity_2m,precipitation&daily=precipitation_sum,precipitation_probability_max&timezone=auto`)
      const json = await res.json()
      if (json.daily) {
        setData(json)
        setError("")
      } else {
        setError("Could not fetch rain & humidity data.")
      }
    } catch {
      setError("An error occurred while fetching rain data.")
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
      await fetchRain(coords.lat, coords.lng)
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
          await fetchRain(position.coords.latitude, position.coords.longitude)
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

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Rain & Humidity</CardTitle>
          <CardDescription>Track precipitation probability and relative humidity.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row items-end gap-3">
               <div className="flex-1 space-y-1.5 w-full">
                 <Label>City or Location</Label>
                 <Input 
                   placeholder="e.g. Seattle, London" 
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
        <div className="space-y-4 animate-in fade-in zoom-in-95">
          <div className="flex flex-col md:flex-row items-center justify-between px-2 gap-4">
             <h3 className="text-xl font-semibold tracking-tight text-center md:text-left">
               {locationName}
             </h3>
             <div className="flex gap-4">
                <div className="flex items-center gap-2 bg-blue-500/10 text-blue-600 px-4 py-2 rounded-full font-medium">
                  <Drop className="size-5" weight="duotone" /> 
                  <span className="font-mono">{data.current.relative_humidity_2m}% Humidity</span>
                </div>
                <div className="flex items-center gap-2 bg-teal-500/10 text-teal-600 px-4 py-2 rounded-full font-medium">
                  <CloudRain className="size-5" weight="duotone" /> 
                  <span className="font-mono">{data.current.precipitation} mm raining now</span>
                </div>
             </div>
          </div>

          <Card>
             <CardContent className="p-0">
               <div className="grid grid-cols-2 md:grid-cols-7 divide-x divide-y md:divide-y-0">
                  {data.daily.time.map((dateStr, i) => {
                    const prob = data.daily.precipitation_probability_max[i] || 0
                    const sum = data.daily.precipitation_sum[i] || 0
                    const isToday = i === 0

                    const date = new Date(dateStr)
                    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date)
                    const isRainy = prob > 50 || sum > 2

                    return (
                      <div key={dateStr} className={`p-4 flex flex-col items-center justify-center text-center gap-3 ${isToday ? "bg-muted/50" : ""}`}>
                         <p className="font-bold text-sm tracking-tight">{isToday ? "Today" : dayName}</p>
                         
                         <div className={`size-12 rounded-full flex items-center justify-center border-4 ${isRainy ? "border-blue-500 bg-blue-500/10 text-blue-600" : "border-muted bg-muted/50 text-muted-foreground"}`}>
                            {isRainy ? <CloudRain className="size-6" weight="duotone" /> : <Drop className="size-6" />}
                         </div>

                         <div className="space-y-1">
                           <p className="text-xl font-mono font-bold text-primary">{prob}%</p>
                           <p className="text-xs font-medium text-muted-foreground tracking-wide font-mono">{sum} mm</p>
                         </div>
                      </div>
                    )
                  })}
               </div>
             </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
