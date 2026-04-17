"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { MapPin, Wind, Compass, SpinnerGap, ArrowUp } from "@phosphor-icons/react"

interface WindData {
  wind_speed_10m: number
  wind_direction_10m: number
  wind_gusts_10m: number
}

// Map degrees (0-360) to cardinal directions
const getWindDirection = (degrees: number) => {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
  const index = Math.round(degrees / 22.5) % 16
  return directions[index]
}

export function WindSpeedTool() {
  const [city, setCity] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [data, setData] = React.useState<WindData | null>(null)
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

  const fetchWind = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m&wind_speed_unit=kmh&timezone=auto`)
      const json = await res.json()
      if (json.current) {
        setData(json.current)
        setError("")
      } else {
        setError("Could not fetch wind data.")
      }
    } catch {
      setError("An error occurred while fetching wind speed.")
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
      await fetchWind(coords.lat, coords.lng)
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
          await fetchWind(position.coords.latitude, position.coords.longitude)
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
    <div className="mx-auto max-w-2xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Wind Speed & Direction</CardTitle>
          <CardDescription>Track local wind speed, gusts, and cardinal direction.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row items-end gap-3">
               <div className="flex-1 space-y-1.5 w-full">
                 <Label>City or Location</Label>
                 <Input 
                   placeholder="e.g. Wellington, Chicago" 
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
        <Card className="animate-in fade-in zoom-in-95 border-teal-500/20">
          <CardContent className="p-0">
             <div className="bg-gradient-to-br from-teal-500/10 to-transparent p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                <div className="space-y-2">
                  <h2 className="text-xl font-medium tracking-tight opacity-80">{locationName}</h2>
                  <div className="flex items-end justify-center md:justify-start gap-2 text-teal-600 dark:text-teal-400">
                    <span className="text-7xl font-bold font-mono tracking-tighter leading-none">
                      {Math.round(data.wind_speed_10m)}
                    </span>
                    <span className="text-2xl font-bold tracking-tight pb-1">km/h</span>
                  </div>
                  <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs mt-2">Wind Speed</p>
                </div>

                <div className="relative size-32 rounded-full border-4 border-teal-500/20 flex flex-col items-center justify-center bg-background shadow-inner">
                   <div 
                     className="absolute inset-0 flex items-center justify-center transition-transform duration-1000 ease-in-out"
                     style={{ transform: `rotate(${data.wind_direction_10m}deg)` }}
                   >
                      <div className="w-full h-full p-2">
                        <ArrowUp className="w-full h-full text-teal-500" weight="fill" />
                      </div>
                   </div>
                   {/* Center dot overlay to make it look like a compass */}
                   <div className="absolute inset-0 flex flex-col items-center justify-center z-10 font-bold bg-background/80 rounded-full inset-8 backdrop-blur-sm shadow-sm ring-1 ring-border">
                     <span className="text-2xl text-foreground">{getWindDirection(data.wind_direction_10m)}</span>
                     <span className="text-xs text-muted-foreground font-mono">{data.wind_direction_10m}°</span>
                   </div>
                   
                   {/* Cardinal letter markers */}
                   <span className="absolute top-1 text-[10px] font-bold opacity-50 z-20">N</span>
                   <span className="absolute bottom-1 text-[10px] font-bold opacity-50 z-20">S</span>
                   <span className="absolute right-2 text-[10px] font-bold opacity-50 z-20">E</span>
                   <span className="absolute left-2 text-[10px] font-bold opacity-50 z-20">W</span>
                </div>
             </div>

             <div className="grid grid-cols-2 divide-x border-t bg-muted/30">
               <div className="p-4 flex items-center justify-center gap-3">
                 <Wind className="size-5 text-indigo-500" weight="duotone" />
                 <div>
                   <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Gusts</p>
                   <p className="font-mono font-bold text-lg">{data.wind_gusts_10m} <span className="text-sm font-normal text-muted-foreground">km/h</span></p>
                 </div>
               </div>
               <div className="p-4 flex items-center justify-center gap-3">
                 <Compass className="size-5 text-orange-500" weight="duotone" />
                 <div>
                   <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Type</p>
                   <p className="font-medium text-sm">{data.wind_speed_10m > 38 ? 'Gale' : data.wind_speed_10m > 20 ? 'Breeze' : 'Light'}</p>
                 </div>
               </div>
             </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
