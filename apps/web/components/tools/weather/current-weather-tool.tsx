"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { MapPin, Sun, Cloud, CloudSun, CloudFog, CloudRain, CloudSnow, CloudLightning, SpinnerGap, Drop, Wind } from "@phosphor-icons/react"

interface WeatherData {
  temperature_2m: number
  apparent_temperature: number
  weather_code: number
  humidity_2m?: number
  wind_speed_10m?: number
}

const WMO_CODES: Record<number, { label: string, icon: React.ElementType }> = {
  0: { label: "Clear sky", icon: Sun },
  1: { label: "Mainly clear", icon: CloudSun },
  2: { label: "Partly cloudy", icon: CloudSun },
  3: { label: "Overcast", icon: Cloud },
  45: { label: "Fog", icon: CloudFog },
  48: { label: "Depositing rime fog", icon: CloudFog },
  51: { label: "Light drizzle", icon: CloudRain },
  53: { label: "Moderate drizzle", icon: CloudRain },
  55: { label: "Dense drizzle", icon: CloudRain },
  61: { label: "Slight rain", icon: CloudRain },
  63: { label: "Moderate rain", icon: CloudRain },
  65: { label: "Heavy rain", icon: CloudRain },
  71: { label: "Slight snow fall", icon: CloudSnow },
  73: { label: "Moderate snow fall", icon: CloudSnow },
  75: { label: "Heavy snow fall", icon: CloudSnow },
  80: { label: "Slight rain showers", icon: CloudRain },
  81: { label: "Moderate rain showers", icon: CloudRain },
  82: { label: "Violent rain showers", icon: CloudRain },
  95: { label: "Thunderstorm", icon: CloudLightning },
  96: { label: "Thunderstorm with slight hail", icon: CloudLightning },
  99: { label: "Thunderstorm with heavy hail", icon: CloudLightning },
}

export function CurrentWeatherTool() {
  const [city, setCity] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [data, setData] = React.useState<WeatherData | null>(null)
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

  const fetchWeather = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&temperature_unit=celsius&wind_speed_unit=kmh`)
      const json = await res.json()
      if (json.current) {
        setData({
          temperature_2m: json.current.temperature_2m,
          apparent_temperature: json.current.apparent_temperature,
          weather_code: json.current.weather_code,
          humidity_2m: json.current.relative_humidity_2m,
          wind_speed_10m: json.current.wind_speed_10m
        })
        setError("")
      } else {
        setError("Could not fetch weather data.")
      }
    } catch {
      setError("An error occurred while fetching weather.")
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
      await fetchWeather(coords.lat, coords.lng)
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
          await fetchWeather(position.coords.latitude, position.coords.longitude)
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

  const weatherInfo = data ? (WMO_CODES[data.weather_code] || { label: "Unknown", icon: Cloud }) : null
  const WeatherIcon = weatherInfo?.icon || Cloud

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Current Weather</CardTitle>
          <CardDescription>Get real-time weather information for any city.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row items-end gap-3">
               <div className="flex-1 space-y-1.5 w-full">
                 <Label>City or Location</Label>
                 <Input 
                   placeholder="e.g. Tokyo, Berlin" 
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

      {data && weatherInfo && (
        <Card className="overflow-hidden border-primary/20 animate-in fade-in zoom-in-95">
          <CardContent className="p-0">
            <div className="bg-gradient-to-br from-primary/10 to-transparent p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">{locationName}</h2>
                <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                  <WeatherIcon className="size-6 text-primary" weight="duotone" />
                  <span className="text-lg font-medium">{weatherInfo.label}</span>
                </div>
              </div>
              
              <div className="text-center md:text-right">
                <div className="text-7xl font-bold font-mono tracking-tighter text-foreground">
                  {Math.round(data.temperature_2m)}°
                </div>
                <p className="text-muted-foreground font-medium mt-2">
                  Feels like {Math.round(data.apparent_temperature)}°C
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x border-t bg-muted/30">
              <div className="p-4 flex items-center justify-center gap-3">
                <Drop className="size-5 text-blue-500" weight="duotone" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Humidity</p>
                  <p className="font-mono font-medium">{data.humidity_2m}%</p>
                </div>
              </div>
              <div className="p-4 flex items-center justify-center gap-3">
                <Wind className="size-5 text-teal-500" weight="duotone" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Wind</p>
                  <p className="font-mono font-medium">{data.wind_speed_10m} km/h</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
