"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { MapPin, Wind, SpinnerGap } from "@phosphor-icons/react"

interface AirQualityData {
  european_aqi: number
  us_aqi: number
  pm10: number
  pm2_5: number
  carbon_monoxide: number
  nitrogen_dioxide: number
  sulphur_dioxide: number
  ozone: number
}

// AQI Color mappings based on standard index ranges
const getAqiColor = (aqi: number) => {
  if (aqi <= 50) return { bg: "bg-green-500/10", border: "border-green-500/20", color: "text-green-600", label: "Good" }
  if (aqi <= 100) return { bg: "bg-yellow-500/10", border: "border-yellow-500/20", color: "text-yellow-600", label: "Moderate" }
  if (aqi <= 150) return { bg: "bg-orange-500/10", border: "border-orange-500/20", color: "text-orange-600", label: "Unhealthy for Sensitive Groups" }
  if (aqi <= 200) return { bg: "bg-red-500/10", border: "border-red-500/20", color: "text-red-600", label: "Unhealthy" }
  if (aqi <= 300) return { bg: "bg-purple-500/10", border: "border-purple-500/20", color: "text-purple-600", label: "Very Unhealthy" }
  return { bg: "bg-rose-900/10", border: "border-rose-900/20", color: "text-rose-900", label: "Hazardous" }
}

export function AirQualityTool() {
  const [city, setCity] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [data, setData] = React.useState<AirQualityData | null>(null)
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

  const fetchAQI = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`)
      const json = await res.json()
      if (json.current) {
        setData(json.current)
        setError("")
      } else {
        setError("Could not fetch air quality data.")
      }
    } catch {
      setError("An error occurred while fetching air quality.")
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
      await fetchAQI(coords.lat, coords.lng)
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
          await fetchAQI(position.coords.latitude, position.coords.longitude)
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

  const aqiTheme = data ? getAqiColor(data.us_aqi) : null

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Air Quality Index</CardTitle>
          <CardDescription>Check live AQI and pollutant breakdown for any city.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row items-end gap-3">
               <div className="flex-1 space-y-1.5 w-full">
                 <Label>City or Location</Label>
                 <Input 
                   placeholder="e.g. Los Angeles, Delhi" 
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

      {data && aqiTheme && (
        <Card className={`border ${aqiTheme.border} ${aqiTheme.bg} overflow-hidden animate-in fade-in zoom-in-95`}>
          <CardContent className="p-0">
             <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center gap-4">
                <h2 className="text-xl font-medium tracking-tight opacity-80">{locationName} AQI</h2>
                <div className={`text-8xl font-bold font-mono tracking-tighter ${aqiTheme.color}`}>
                  {data.us_aqi}
                </div>
                <div className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest ${aqiTheme.color} drop-shadow-sm`}>
                  {aqiTheme.label}
                </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y border-t bg-background/50">
               {[
                 { label: "PM2.5", val: data.pm2_5, unit: "µg/m³" },
                 { label: "PM10", val: data.pm10, unit: "µg/m³" },
                 { label: "Ozone", val: data.ozone, unit: "µg/m³" },
                 { label: "NO₂", val: data.nitrogen_dioxide, unit: "µg/m³" },
                 { label: "SO₂", val: data.sulphur_dioxide, unit: "µg/m³" },
                 { label: "CO", val: data.carbon_monoxide, unit: "µg/m³" },
                 { label: "Euro AQI", val: data.european_aqi, unit: "EU" }
               ].map(stat => (
                 <div key={stat.label} className="p-4 flex flex-col items-center text-center">
                    <p className="text-xs text-muted-foreground font-semibold mb-1">{stat.label}</p>
                    <p className="font-mono font-bold text-base">{stat.val} <span className="text-xs text-muted-foreground">{stat.unit}</span></p>
                 </div>
               ))}
               <div className="p-4 flex items-center justify-center">
                 <Wind className="size-8 opacity-20" />
               </div>
             </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
