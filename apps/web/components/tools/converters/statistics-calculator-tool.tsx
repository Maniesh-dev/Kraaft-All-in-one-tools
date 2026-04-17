"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Textarea } from "@workspace/ui/components/textarea"
import { ChartLineUp, Target, ChartBar } from "@phosphor-icons/react"
import { Button } from "@workspace/ui/components/button"

function calculateStats(numbers: number[]) {
  if (numbers.length === 0) return null
   
  const sorted = [...numbers].sort((a, b) => a - b)
  const count = sorted.length
  const sum = sorted.reduce((a, b) => a + b, 0)
  const mean = sum / count
  const min = sorted[0]!
  const max = sorted[count - 1]!
  const range = max - min
  
  // Median
  const mid = Math.floor(count / 2)
  const median = count % 2 !== 0 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2

  // Mode (can be multiple)
  const freq: Record<number, number> = {}
  let maxFreq = 0
  sorted.forEach(n => {
     freq[n] = (freq[n] || 0) + 1
     if (freq[n]! > maxFreq) maxFreq = freq[n]!
  })
  const modes = Object.keys(freq).filter(k => freq[Number(k)] === maxFreq).map(Number)
  const modeLabel = maxFreq === 1 ? "None (All unique)" : modes.join(', ')

  // Variance & Standard Deviation (Sample)
  const varianceSample = count > 1 ? sorted.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (count - 1) : 0
  const sdSample = Math.sqrt(varianceSample)

  // Variance & Standard Deviation (Population)
  const variancePop = sorted.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / count
  const sdPop = Math.sqrt(variancePop)

  return {
     count, sum, mean, min, max, range, median, modeLabel, varianceSample, sdSample, variancePop, sdPop
  }
}

export function StatisticsCalculatorTool() {
  const [input, setInput] = React.useState("10, 25, 42, 60, 25, 10, 15")
  const [stats, setStats] = React.useState<ReturnType<typeof calculateStats>>(null)

  React.useEffect(() => {
     // Extract trailing numbers properly including negatives and decimals
     const matches = input.match(/-?\d+(\.\d+)?/g)
     if (matches && matches.length > 0) {
        const nums = matches.map(Number)
        setStats(calculateStats(nums))
     } else {
        setStats(null)
     }
  }, [input])

  const format = (num: number) => Number(num.toFixed(4)).toString()

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartLineUp className="text-primary" /> Statistics Calculator
          </CardTitle>
          <CardDescription>Input a dataset to calculate mean, median, standard deviation and more.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
             <div className="flex justify-between items-end">
                <label className="text-sm font-semibold tracking-wide text-muted-foreground">Dataset (Comma separated values)</label>
                {stats && <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-bold">{stats.count} values detected</span>}
             </div>
             <Textarea 
               placeholder="e.g. 5, 10.5, 15, -2, 40" 
               className="min-h-[120px] text-lg font-mono"
               value={input}
               onChange={(e) => setInput(e.target.value)}
             />
          </div>

          {stats ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-muted/30 border rounded-xl p-4 flex flex-col justify-center items-center text-center shadow-sm">
                   <Target className="text-primary mb-2 opacity-50" size={24} />
                   <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">Mean (Average)</p>
                   <p className="text-2xl font-black">{format(stats.mean)}</p>
                </div>
                <div className="bg-muted/30 border rounded-xl p-4 flex flex-col justify-center items-center text-center shadow-sm">
                   <ChartBar className="text-primary mb-2 opacity-50" size={24} />
                   <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">Median</p>
                   <p className="text-2xl font-black">{format(stats.median)}</p>
                </div>
                <div className="bg-muted/30 border rounded-xl p-4 flex flex-col justify-center items-center text-center shadow-sm">
                   <ChartBar className="text-primary mb-2 opacity-50" size={24} />
                   <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">Mode</p>
                   <p className="text-lg leading-tight font-black">{stats.modeLabel}</p>
                </div>
                <div className="bg-muted/30 border rounded-xl p-4 flex flex-col justify-center items-center text-center shadow-sm">
                   <ChartLineUp className="text-primary mb-2 opacity-50" size={24} />
                   <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">Range</p>
                   <p className="text-2xl font-black">{format(stats.range)}</p>
                </div>

                {/* Additional Stats Table */}
                <div className="col-span-full mt-4 bg-card border rounded-xl overflow-hidden shadow-sm">
                   <div className="bg-muted px-4 py-2 font-semibold text-sm">Detailed Analysis</div>
                   <div className="p-0">
                      <table className="w-full text-sm text-left">
                         <tbody className="divide-y">
                            <tr>
                               <td className="px-4 py-3 font-medium text-muted-foreground w-1/2">Sum</td>
                               <td className="px-4 py-3 font-bold">{format(stats.sum)}</td>
                            </tr>
                            <tr className="bg-muted/10">
                               <td className="px-4 py-3 font-medium text-muted-foreground">Min / Max</td>
                               <td className="px-4 py-3 font-bold">{format(stats.min)} / {format(stats.max)}</td>
                            </tr>
                            <tr>
                               <td className="px-4 py-3 font-medium text-muted-foreground">Standard Deviation (Population)</td>
                               <td className="px-4 py-3 font-bold">{format(stats.sdPop)}</td>
                            </tr>
                            <tr className="bg-muted/10">
                               <td className="px-4 py-3 font-medium text-muted-foreground">Variance (Population)</td>
                               <td className="px-4 py-3 font-bold">{format(stats.variancePop)}</td>
                            </tr>
                            <tr>
                               <td className="px-4 py-3 font-medium text-muted-foreground">Standard Deviation (Sample)</td>
                               <td className="px-4 py-3 font-bold">{format(stats.sdSample)}</td>
                            </tr>
                            <tr className="bg-muted/10">
                               <td className="px-4 py-3 font-medium text-muted-foreground">Variance (Sample)</td>
                               <td className="px-4 py-3 font-bold">{format(stats.varianceSample)}</td>
                            </tr>
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>
          ) : (
             <div className="text-center p-12 border border-dashed rounded-xl text-muted-foreground bg-muted/10">
                Please enter a valid dataset array above.
             </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
