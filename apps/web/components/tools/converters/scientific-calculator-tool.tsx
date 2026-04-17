"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Calculator as CalcIcon, X } from "@phosphor-icons/react"

export function ScientificCalculatorTool() {
  const [expression, setExpression] = React.useState("")
  const [result, setResult] = React.useState("")

  const append = (str: string) => {
    if (result && expression === result) {
      if (/[0-9]/.test(str)) {
         setExpression(str)
         setResult("")
         return
      }
    }
    setExpression(prev => prev + str)
    setResult("")
  }

  const clear = () => {
    setExpression("")
    setResult("")
  }

  const backspace = () => {
    setExpression(prev => prev.slice(0, -1))
  }

  const calculate = () => {
    try {
      if (!expression) return
      // Safe evaluation of mathematical expressions by removing all alpha chars except supported constants/functions
      let sanitized = expression
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/\^/g, '**');

      // Extremely strict character whitelist before execution
      if (/[^0-9\+\-\*\/\(\)\.\sMathPIEsincoaltgqr*]/.test(sanitized)) {
         throw new Error("Invalid characters")
      }

      // eslint-disable-next-line no-new-func
      const func = new Function(`return ${sanitized}`);
      let res = func();

      if (typeof res === "number") {
         res = parseFloat(res.toFixed(10)) // Prevent floating point heavy artifacts
      }

      setResult(String(res))
      setExpression(String(res))
    } catch (e) {
      setResult("Error")
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-8">
      <Card className="border-2 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <CalcIcon className="text-primary" /> Scientific Calculator
          </CardTitle>
          <CardDescription>Perform basic and scientific calculations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-xl mb-4 text-right flex flex-col justify-end min-h-[100px] shadow-inner break-all">
             <div className="text-muted-foreground min-h-[20px] tracking-widest text-sm">{result ? "Ans" : ""}</div>
             <div className="text-3xl font-black font-mono tracking-tighter">{expression || "0"}</div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {/* Row 1 Scientific + Clear */}
            <Button variant="secondary" onClick={() => append('sin(')}>sin</Button>
            <Button variant="secondary" onClick={() => append('cos(')}>cos</Button>
            <Button variant="secondary" onClick={() => append('tan(')}>tan</Button>
            <Button variant="destructive" onClick={clear}>AC</Button>

            {/* Row 2 Scientific + Backspace */}
            <Button variant="secondary" onClick={() => append('log(')}>log</Button>
            <Button variant="secondary" onClick={() => append('ln(')}>ln</Button>
            <Button variant="secondary" onClick={() => append('sqrt(')}>√</Button>
            <Button variant="outline" onClick={backspace}><X weight="bold" /></Button>

            {/* Row 3 Digits + Operators */}
            <Button variant="secondary" onClick={() => append('(')}>(</Button>
            <Button variant="secondary" onClick={() => append(')')}>)</Button>
            <Button variant="secondary" onClick={() => append('^')}>^</Button>
            <Button variant="default" className="text-xl" onClick={() => append('/')}>÷</Button>

            <Button variant="outline" className="text-xl font-bold" onClick={() => append('7')}>7</Button>
            <Button variant="outline" className="text-xl font-bold" onClick={() => append('8')}>8</Button>
            <Button variant="outline" className="text-xl font-bold" onClick={() => append('9')}>9</Button>
            <Button variant="default" className="text-xl" onClick={() => append('*')}>×</Button>

            <Button variant="outline" className="text-xl font-bold" onClick={() => append('4')}>4</Button>
            <Button variant="outline" className="text-xl font-bold" onClick={() => append('5')}>5</Button>
            <Button variant="outline" className="text-xl font-bold" onClick={() => append('6')}>6</Button>
            <Button variant="default" className="text-xl" onClick={() => append('-')}>−</Button>

            <Button variant="outline" className="text-xl font-bold" onClick={() => append('1')}>1</Button>
            <Button variant="outline" className="text-xl font-bold" onClick={() => append('2')}>2</Button>
            <Button variant="outline" className="text-xl font-bold" onClick={() => append('3')}>3</Button>
            <Button variant="default" className="text-xl" onClick={() => append('+')}>+</Button>

            <Button variant="secondary" className="text-lg font-bold" onClick={() => append('π')}>π</Button>
            <Button variant="outline" className="text-xl font-bold" onClick={() => append('0')}>0</Button>
            <Button variant="outline" className="text-xl font-bold" onClick={() => append('.')}>.</Button>
            <Button variant="default" className="text-xl bg-orange-600 hover:bg-orange-700 text-white" onClick={calculate}>=</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
