"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Input } from "@workspace/ui/components/input"
import { ArrowsLeftRight, Scales } from "@phosphor-icons/react"
import { Label } from "@workspace/ui/components/label"

type UnitCategory = "Length" | "Weight" | "Temperature" | "Area" | "Volume"

const conversionRates: Record<UnitCategory, Record<string, number | ((val: number, toBase: boolean) => number)>> = {
  Length: {
    Meter: 1,
    Kilometer: 1000,
    Centimeter: 0.01,
    Millimeter: 0.001,
    Mile: 1609.34,
    Yard: 0.9144,
    Foot: 0.3048,
    Inch: 0.0254,
  },
  Weight: {
    Kilogram: 1,
    Gram: 0.001,
    Milligram: 0.000001,
    "Metric Ton": 1000,
    Pound: 0.453592,
    Ounce: 0.0283495,
  },
  Temperature: {
    Celsius: 1, // base
    Fahrenheit: (val: number, toBase: boolean) => (toBase ? (val - 32) * (5 / 9) : (val * 9 / 5) + 32),
    Kelvin: (val: number, toBase: boolean) => (toBase ? val - 273.15 : val + 273.15),
  },
  Area: {
    "Square Meter": 1,
    "Square Kilometer": 1000000,
    "Square Centimeter": 0.0001,
    Hectare: 10000,
    Acre: 4046.86,
    "Square Mile": 2589988.11,
    "Square Foot": 0.092903,
    "Square Inch": 0.00064516,
  },
  Volume: {
    Liter: 1,
    Milliliter: 0.001,
    "Cubic Meter": 1000,
    Gallon: 3.78541,
    Quart: 0.946353,
    Pint: 0.473176,
    Cup: 0.24,
    "Fluid Ounce": 0.0295735,
  }
}

export function UnitConverterTool() {
  const [category, setCategory] = React.useState<UnitCategory>("Length")
  
  const categories = Object.keys(conversionRates) as UnitCategory[]
  const initialUnits = Object.keys(conversionRates["Length"])
  
  const [fromUnit, setFromUnit] = React.useState(initialUnits[0] ?? "Meter")
  const [toUnit, setToUnit] = React.useState(initialUnits[1] ?? "Kilometer")
  const [fromValue, setFromValue] = React.useState("1")
  const [toValue, setToValue] = React.useState("0.001")

  const handleCategoryChange = (val: UnitCategory) => {
    setCategory(val)
    const units = Object.keys(conversionRates[val])
    if (units.length >= 2) {
      setFromUnit(units[0]!)
      setToUnit(units[1]!)
      calculate(1, units[0]!, units[1]!, val, true)
    }
  }

  const calculate = (val: number, source: string, target: string, cat: UnitCategory, isFrom: boolean) => {
    const rates = conversionRates[cat]
    const sourceRate = rates[source]
    const targetRate = rates[target]
    
    if (sourceRate === undefined || targetRate === undefined) return;

    if (isNaN(val)) {
        if (isFrom) setToValue("")
        else setFromValue("")
        return;
    }

    let baseValue = 0;
    
    if (typeof sourceRate === 'function') {
        baseValue = sourceRate(val, true)
    } else {
        baseValue = val * sourceRate;
    }

    let endValue = 0;
    if (typeof targetRate === 'function') {
        endValue = targetRate(baseValue, false)
    } else {
        endValue = baseValue / targetRate;
    }

    const roundedValue = Number(endValue.toFixed(6)).toString();

    if (isFrom) {
        setToValue(roundedValue)
    } else {
        setFromValue(roundedValue)
    }
  }

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFromValue(e.target.value)
    calculate(parseFloat(e.target.value), fromUnit, toUnit, category, true)
  }

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToValue(e.target.value)
    calculate(parseFloat(e.target.value), toUnit, fromUnit, category, false) // Note reverse
  }

  const handleFromUnitChange = (val: string) => {
    setFromUnit(val)
    calculate(parseFloat(fromValue), val, toUnit, category, true)
  }

  const handleToUnitChange = (val: string) => {
    setToUnit(val)
    calculate(parseFloat(fromValue), fromUnit, val, category, true)
  }

  const swapUnits = () => {
    setFromUnit(toUnit)
    setToUnit(fromUnit)
    setFromValue(toValue)
    setToValue(fromValue)
  }

  const units = Object.keys(conversionRates[category])

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scales className="text-primary" /> Unit Converter
          </CardTitle>
          <CardDescription>Instantly convert numbers between units of measurement.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
             <Select value={category} onValueChange={(v) => handleCategoryChange(v as UnitCategory)}>
                <SelectTrigger className="w-[200px] h-10 shadow-sm border-primary/20 bg-muted/20">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
             </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center pt-4">
             <div className="space-y-3 p-4 border rounded-xl bg-card shadow-sm">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider font-bold">From</Label>
                <Input 
                   type="number"
                   className="text-2xl font-bold h-14 border-none shadow-none focus-visible:ring-0 px-0"
                   value={fromValue}
                   onChange={handleFromChange}
                   placeholder="0"
                />
                <Select value={fromUnit} onValueChange={handleFromUnitChange}>
                  <SelectTrigger className="w-full bg-muted/40 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
             </div>

             <div className="flex justify-center -my-2 md:my-0 md:-mx-2 z-10 relative">
                <button 
                  onClick={swapUnits}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground size-10 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer"
                  title="Swap Units"
                >
                  <ArrowsLeftRight weight="bold" />
                </button>
             </div>

             <div className="space-y-3 p-4 border rounded-xl bg-card shadow-sm">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider font-bold">To</Label>
                <Input 
                   type="number"
                   className="text-2xl font-bold h-14 border-none shadow-none focus-visible:ring-0 px-0"
                   value={toValue}
                   onChange={handleToChange}
                   placeholder="0"
                />
                <Select value={toUnit} onValueChange={handleToUnitChange}>
                  <SelectTrigger className="w-full bg-muted/40 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
             </div>
          </div>
          
          <div className="bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded-lg p-4 text-center text-sm mt-4 font-medium">
             {fromValue || 0} {fromUnit} = <span className="font-bold text-base">{toValue || 0} {toUnit}</span>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
