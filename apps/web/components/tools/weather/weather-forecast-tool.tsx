"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { MapPin, Sun, Cloud, CloudSun, CloudFog, CloudRain, CloudSnow, CloudLightning, SpinnerGap } from "@phosphor-icons/react"

interface ForecastData {
  time: string[]
  weather_code: number[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
}

const WMO_CODES: Record<number, { label: string, icon: React.ElementType }> = {
  0: { label: "Clear sky", icon: Sun },
  1: { label: "Mainly clear", icon: CloudSun },
  2: { label: "Partly cloudy", icon: CloudSun },
  3: { label: "Overcast", icon: Cloud },
  45: { label: "Fog", icon: CloudFog },
  48: { label: "Rime fog", icon: CloudFog },
  51: { label: "Light drizzle", icon: CloudRain },
  53: { label: "Drizzle", icon: CloudRain },
  55: { label: "Dense drizzle", icon: CloudRain },
  61: { label: "Slight rain", icon: CloudRain },
  63: { label: "Moderate rain", icon: CloudRain },
  65: { label: "Heavy rain", icon: CloudRain },
  71: { label: "Slight snow", icon: CloudSnow },
  73: { label: "Moderate snow", icon: CloudSnow },
  75: { label: "Heavy snow", icon: CloudSnow },
  80: { label: "Slight showers", icon: CloudRain },
  81: { label: "Moderate showers", icon: CloudRain },
  82: { label: "Violent showers", icon: CloudRain },
  95: { label: "Thunderstorm", icon: CloudLightning },
  96: { label: "Thunderstorm/hail", icon: CloudLightning },
  99: { label: "Heavy thunderstorm", icon: CloudLightning },
}

export function WeatherForecastTool() {
  const [city, setCity] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [data, setData] = React.useState<ForecastData | null>(null)
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

  const fetchForecast = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`)
      const json = await res.json()
      if (json.daily) {
        setData(json.daily)
        setError("")
      } else {
        setError("Could not fetch forecast data.")
      }
    } catch {
      setError("An error occurred while fetching forecast.")
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
      await fetchForecast(coords.lat, coords.lng)
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
          await fetchForecast(position.coords.latitude, position.coords.longitude)
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
          <CardTitle>7-Day Forecast</CardTitle>
          <CardDescription>Get weekly weather conditions and highs/lows.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row items-end gap-3">
               <div className="flex-1 space-y-1.5 w-full">
                 <Label>City or Location</Label>
                 <Input 
                   placeholder="e.g. Paris, Sydney" 
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
          <h3 className="text-xl font-semibold tracking-tight text-center md:text-left">
            Forecast for {locationName}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {data.time.map((dateStr, i) => {
              const code = data.weather_code[i] ?? 0
              const info = WMO_CODES[code] || { label: "Unknown", icon: Cloud }
              const IconComp = info.icon
              const isToday = i === 0

              const date = new Date(dateStr)
              const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date)
              const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)

              return (
                <Card key={dateStr} className={`md:flex-col overflow-hidden ${isToday ? 'border-primary ring-1 ring-primary/20' : ''}`}>
                  <CardContent className="p-4 flex flex-row md:flex-col items-center justify-between md:justify-center text-center gap-2">
                    <div className="md:w-full space-y-0.5 text-left md:text-center">
                      <p className="font-bold">{isToday ? 'Today' : dayName}</p>
                      <p className="text-xs text-muted-foreground">{monthDay}</p>
                    </div>
                    
                    <div className="flex flex-col items-center flex-1 md:flex-initial my-2 text-primary">
                      <IconComp className="size-8 mb-1" weight={isToday ? "duotone" : "regular"} />
                      <span className="text-[10px] uppercase font-semibold tracking-wider opacity-80 leading-tight">
                        {info.label.split(' ')[0]}
                      </span>
                    </div>

                    <div className="flex flex-col md:flex-row items-end md:items-center justify-end gap-1 md:gap-2 text-sm font-mono w-16 md:w-full">
                      <span className="font-bold">{Math.round(data.temperature_2m_max[i] ?? 0)}°</span>
                      <span className="text-muted-foreground">{Math.round(data.temperature_2m_min[i] ?? 0)}°</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
