"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Button } from "@workspace/ui/components/button"
import { Fire, Heartbeat, Pizza } from "@phosphor-icons/react"

export function CalorieCalculatorTool() {
  const [age, setAge] = React.useState("25")
  const [gender, setGender] = React.useState<"male" | "female">("male")
  const [heightCm, setHeightCm] = React.useState("175")
  const [weightKg, setWeightKg] = React.useState("70")
  const [activity, setActivity] = React.useState("1.55") // Moderate

  const results = React.useMemo(() => {
     const w = parseFloat(weightKg) || 0
     const h = parseFloat(heightCm) || 0
     const a = parseInt(age, 10) || 0
     
     if (w <= 0 || h <= 0 || a <= 0) return null;

     // Mifflin-St Jeor
     let bmr = 10 * w + 6.25 * h - 5 * a;
     bmr += gender === "male" ? 5 : -161;
     
     const maintain = bmr * parseFloat(activity);
     
     return {
        bmr: Math.round(bmr),
        maintain: Math.round(maintain),
        mildWeightLoss: Math.round(maintain - 250),
        weightLoss: Math.round(maintain - 500),
        extremeWeightLoss: Math.round(maintain - 1000),
        mildWeightGain: Math.round(maintain + 250),
        weightGain: Math.round(maintain + 500),
     }
  }, [age, gender, heightCm, weightKg, activity])

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fire className="text-primary" /> Calorie Calculator (TDEE)
          </CardTitle>
          <CardDescription>Calculate your daily calorie needs based on the Mifflin-St Jeor equation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             
             {/* Form Configuration */}
             <div className="space-y-6 border rounded-xl p-5 bg-card/50">
               
               <div className="space-y-3">
                 <Label>Gender</Label>
                 <div className="flex space-x-6 items-center h-10">
                    <label className="flex items-center space-x-2 cursor-pointer relative">
                       <input 
                         type="radio" 
                         name="gender" 
                         value="male" 
                         checked={gender === "male"} 
                         onChange={(e) => setGender(e.target.value as "male" | "female")} 
                         className="peer sr-only"
                       />
                       <div className="w-5 h-5 rounded-full border-2 border-primary/50 peer-checked:border-primary peer-checked:border-[6px] transition-all"></div>
                       <span className="font-medium text-sm">Male</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer relative">
                       <input 
                         type="radio" 
                         name="gender" 
                         value="female" 
                         checked={gender === "female"} 
                         onChange={(e) => setGender(e.target.value as "male" | "female")}
                         className="peer sr-only"
                       />
                       <div className="w-5 h-5 rounded-full border-2 border-primary/50 peer-checked:border-primary peer-checked:border-[6px] transition-all"></div>
                       <span className="font-medium text-sm">Female</span>
                    </label>
                 </div>
               </div>

               <div className="space-y-2">
                 <Label>Age (years)</Label>
                 <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} min={1} max={120} />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Height (cm)</Label>
                    <Input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} min={50} max={300} />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} min={20} max={300} />
                  </div>
               </div>

               <div className="space-y-2">
                  <Label>Activity Level</Label>
                  <Select value={activity} onValueChange={setActivity}>
                     <SelectTrigger>
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="1.2">Sedentary (little to no exercise)</SelectItem>
                        <SelectItem value="1.375">Lightly Active (light exercise/sports 1-3 days)</SelectItem>
                        <SelectItem value="1.55">Moderately Active (moderate 3-5 days)</SelectItem>
                        <SelectItem value="1.725">Very Active (hard exercise/sports 6-7 days)</SelectItem>
                        <SelectItem value="1.9">Extra Active (very hard exercise/physical job)</SelectItem>
                     </SelectContent>
                  </Select>
               </div>

             </div>

             {/* Results Canvas */}
             <div className="flex flex-col gap-4">
                {results ? (
                   <>
                      <div className="bg-primary text-primary-foreground p-6 rounded-xl text-center shadow-lg relative overflow-hidden">
                         <div className="relative z-10">
                            <span className="text-xs uppercase tracking-widest font-bold opacity-80 block mb-1">Maintenance Calorie</span>
                            <div className="text-4xl font-black">{results.maintain.toLocaleString()} <span className="text-lg font-medium opacity-80 line-through decoration-transparent">kcal/day</span></div>
                            <p className="text-sm opacity-90 mt-2">Eat this amount to maintain your current weight.</p>
                         </div>
                         <Heartbeat weight="fill" className="absolute -right-6 -bottom-6 size-40 opacity-10" />
                      </div>

                      <div className="grid grid-cols-2 gap-4 flex-1">
                         <div className="bg-orange-500/10 border-orange-500/30 border text-orange-900 dark:text-orange-200 rounded-xl p-4 text-center flex flex-col justify-center">
                            <p className="text-xs uppercase font-bold tracking-wider mb-2 opacity-70">Weight Loss <span className="lowercase font-normal">(-0.5kg/wk)</span></p>
                            <p className="text-2xl font-black">{results.weightLoss.toLocaleString()} <span className="text-sm">kcal</span></p>
                         </div>
                         <div className="bg-emerald-500/10 border-emerald-500/30 border text-emerald-900 dark:text-emerald-200 rounded-xl p-4 text-center flex flex-col justify-center">
                            <p className="text-xs uppercase font-bold tracking-wider mb-2 opacity-70">Weight Gain <span className="lowercase font-normal">(+0.5kg/wk)</span></p>
                            <p className="text-2xl font-black">{results.weightGain.toLocaleString()} <span className="text-sm">kcal</span></p>
                         </div>
                         <div className="col-span-2 bg-muted/30 border rounded-xl p-4 text-center flex items-center justify-between">
                            <div className="text-left">
                               <p className="text-xs uppercase font-bold tracking-wider opacity-70">Basal Metabolic Rate (BMR)</p>
                               <p className="text-xs text-muted-foreground">Calories burned simply sitting in bed all day.</p>
                            </div>
                            <div className="text-xl font-bold">{results.bmr.toLocaleString()} kcal</div>
                         </div>
                      </div>
                   </>
                ) : (
                   <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground border border-dashed rounded-xl p-8 text-center bg-muted/10">
                      <Pizza size={48} className="opacity-20 mb-4" />
                      <p>Enter your physiological data to instantly calculate your daily targets.</p>
                   </div>
                )}
             </div>

          </div>
        </CardContent>
      </Card>
    </div>
  )
}
