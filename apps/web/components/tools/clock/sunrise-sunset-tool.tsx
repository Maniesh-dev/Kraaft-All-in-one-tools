"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { MapPin, Sun, Moon, SpinnerGap, SunDim } from "@phosphor-icons/react"
import { Label } from "@workspace/ui/components/label"

interface SunriseSunsetData {
  sunrise: string
  sunset: string
  solar_noon: string
  day_length: string
}

export function SunriseSunsetTool() {
  const [city, setCity] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [data, setData] = React.useState<SunriseSunsetData | null>(null)
  const [error, setError] = React.useState("")
  const [locationName, setLocationName] = React.useState("")

  const fetchCoordinates = async (query: string): Promise<{lat: number, lng: number, name: string} | null> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`)
      const [first] = await res.json()
      if (first) {
        return {
          lat: parseFloat(first.lat),
          lng: parseFloat(first.lon),
          name: first.display_name.split(',')[0]
        }
      }
      return null
    } catch {
      return null
    }
  }

  const fetchSunriseSunset = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&formatted=0`)
      const json = await res.json()
      if (json.status === "OK") {
        setData(json.results)
        setError("")
      } else {
        setError("Could not fetch data for this location.")
      }
    } catch {
      setError("An error occurred while fetching data.")
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
      await fetchSunriseSunset(coords.lat, coords.lng)
    } else {
      setError("Could not find location.")
    }
    setLoading(false)
  }

  const geolocate = () => {
    if ("geolocation" in navigator) {
      setLoading(true)
      setData(null)
      setError("")
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setLocationName("Your Location")
          await fetchSunriseSunset(position.coords.latitude, position.coords.longitude)
          setCity("")
          setLoading(false)
        },
        () => {
          setError("Could not access your location.")
          setLoading(false)
        }
      )
    } else {
      setError("Geolocation is not supported by your browser.")
    }
  }

  const formatTime = (isoString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString))
  }

  // Convert seconds to readable format
  const formatDuration = (secondsStr: string) => {
    const seconds = parseInt(secondsStr, 10)
    if (isNaN(seconds)) return secondsStr
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h} hrs ${m} mins`
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Sunrise & Sunset</CardTitle>
          <CardDescription>Find sunrise and sunset times for any location.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row items-end gap-3">
               <div className="flex-1 space-y-1.5">
                 <Label>City or Location</Label>
                 <Input 
                   placeholder="e.g. London, New York" 
                   value={city}
                   onChange={(e) => setCity(e.target.value)}
                 />
               </div>
               <Button type="submit" disabled={loading || !city.trim()}>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in zoom-in-95">
          <Card className="bg-orange-500/10 border-orange-500/20">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-2">
              <Sun className="size-12 text-orange-500 mb-2" />
              <h3 className="text-muted-foreground font-medium uppercase tracking-wider text-xs">Sunrise</h3>
              <div className="text-4xl font-bold font-mono tracking-tighter text-orange-600 dark:text-orange-400">
                {formatTime(data.sunrise)}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-indigo-500/10 border-indigo-500/20">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-2">
              <Moon className="size-12 text-indigo-500 mb-2" />
              <h3 className="text-muted-foreground font-medium uppercase tracking-wider text-xs">Sunset</h3>
              <div className="text-4xl font-bold font-mono tracking-tighter text-indigo-600 dark:text-indigo-400">
                {formatTime(data.sunset)}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardContent className="p-6">
               <h3 className="text-center font-medium text-lg mb-4">{locationName} Details</h3>
               <div className="grid grid-cols-2 gap-4 text-center">
                 <div className="p-4 bg-muted/50 rounded-xl">
                   <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">Solar Noon</p>
                   <p className="text-xl font-bold font-mono">{formatTime(data.solar_noon)}</p>
                 </div>
                 <div className="p-4 bg-muted/50 rounded-xl">
                   <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">Day Length</p>
                   <p className="text-xl font-bold font-mono text-primary">{formatDuration(data.day_length)}</p>
                 </div>
               </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
