"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Input } from "@workspace/ui/components/input"
import { CurrencyDollar, ArrowsLeftRight, ArrowsClockwise, WarningCircle } from "@phosphor-icons/react"
import { Label } from "@workspace/ui/components/label"
import { Button } from "@workspace/ui/components/button"

export function CurrencyConverterTool() {
  const [rates, setRates] = React.useState<Record<string, number> | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [fromCurrency, setFromCurrency] = React.useState("USD")
  const [toCurrency, setToCurrency] = React.useState("EUR")
  const [fromValue, setFromValue] = React.useState("100")
  const [toValue, setToValue] = React.useState("")

  const fetchRates = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD")
      if (!res.ok) throw new Error("Failed to fetch rates")
      const data = await res.json()
      setRates(data.rates)
      setLastUpdated(new Date(data.time_last_update_unix * 1000).toLocaleString())
      // Trigger initial calculation
      calculate(parseFloat(fromValue || "0"), fromCurrency, toCurrency, data.rates, true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchRates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const calculate = (val: number, source: string, target: string, rateData: Record<string, number> | null, isFrom: boolean) => {
    if (!rateData) return;
    const sourceRate = rateData[source]
    const targetRate = rateData[target]
    if (sourceRate === undefined || targetRate === undefined) return;

    if (isNaN(val)) {
        if (isFrom) setToValue("")
        else setFromValue("")
        return;
    }

    // Convert to USD base first
    const baseUsd = val / sourceRate;
    const finalVal = baseUsd * targetRate;

    const rounded = finalVal.toFixed(2);

    if (isFrom) {
        setToValue(rounded)
    } else {
        setFromValue(rounded)
    }
  }

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFromValue(e.target.value)
    calculate(parseFloat(e.target.value), fromCurrency, toCurrency, rates, true)
  }

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToValue(e.target.value)
    calculate(parseFloat(e.target.value), toCurrency, fromCurrency, rates, false)
  }

  const handleFromCurrencyChange = (val: string) => {
    setFromCurrency(val)
    calculate(parseFloat(fromValue), val, toCurrency, rates, true)
  }

  const handleToCurrencyChange = (val: string) => {
    setToCurrency(val)
    calculate(parseFloat(fromValue), fromCurrency, val, rates, true)
  }

  const swapCurrencies = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
    setFromValue(toValue)
    setToValue(fromValue)
  }

  const currencies = rates ? Object.keys(rates) : ["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD"]

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Card>
        <CardHeader className="flex flex-row justify-between items-start">
          <div>
             <CardTitle className="flex items-center gap-2">
               <CurrencyDollar className="text-primary" /> Currency Converter
             </CardTitle>
             <CardDescription>Live exchange rates from open markets directly to your browser.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRates} disabled={loading} title="Refresh Rates">
            <ArrowsClockwise className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
               <WarningCircle size={20} />
               Failed to fetch live rates. Please try refreshing.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
             <div className="space-y-3 p-4 border rounded-xl bg-card shadow-sm">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider font-bold">Amount</Label>
                <Input 
                   type="number"
                   className="text-2xl font-bold h-14 border-none shadow-none focus-visible:ring-0 px-0"
                   value={fromValue}
                   onChange={handleFromChange}
                   placeholder="0.00"
                   disabled={!rates}
                />
                <Select value={fromCurrency} onValueChange={handleFromCurrencyChange} disabled={!rates}>
                  <SelectTrigger className="w-full bg-muted/40 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     {currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
             </div>

             <div className="flex justify-center -my-2 md:my-0 md:-mx-2 z-10 relative">
                <button 
                  onClick={swapCurrencies}
                  disabled={!rates}
                  className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground size-10 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer"
                  title="Swap Currencies"
                >
                  <ArrowsLeftRight weight="bold" />
                </button>
             </div>

             <div className="space-y-3 p-4 border rounded-xl bg-card shadow-sm">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider font-bold">Converted To</Label>
                <Input 
                   type="number"
                   className="text-2xl font-bold h-14 border-none shadow-none focus-visible:ring-0 px-0"
                   value={toValue}
                   onChange={handleToChange}
                   placeholder="0.00"
                   disabled={!rates}
                />
                <Select value={toCurrency} onValueChange={handleToCurrencyChange} disabled={!rates}>
                  <SelectTrigger className="w-full bg-muted/40 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     {currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
             </div>
          </div>
          
          <div className="bg-muted/30 text-muted-foreground rounded-lg p-4 flex flex-col items-center justify-center text-sm mt-4 gap-1">
             <div className="font-semibold text-foreground">
               {fromValue || 0} {fromCurrency} = {toValue || 0} {toCurrency}
             </div>
             {rates && (
                 <div className="text-xs">
                    Market Exchange Rate: 1 {fromCurrency} = {(rates[toCurrency]! / rates[fromCurrency]!).toFixed(4)} {toCurrency}
                 </div>
             )}
             <div className="text-[10px] opacity-70 mt-1">
                Last updated: {lastUpdated || "Loading..."} (open.er-api.com)
             </div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
