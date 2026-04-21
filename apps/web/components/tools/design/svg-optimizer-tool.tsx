"use client";

import * as React from "react";
import { Scissors, Copy, Check, Download, ArrowClockwise, Sparkle, Code, Eye } from "@phosphor-icons/react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Textarea } from "@workspace/ui/components/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { toast } from "sonner";

export function SvgOptimizerTool() {
  const [svg, setSvg] = React.useState("");
  const [optimizedSvg, setOptimizedSvg] = React.useState("");
  const [stats, setStats] = React.useState<{
    originalSize: number;
    optimizedSize: number;
    saved: number;
    percent: number;
  } | null>(null);
  const [isOptimizing, setIsOptimizing] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "image/svg+xml" && !file.name.endsWith(".svg")) {
      toast.error("Please upload a valid SVG file");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSvg(reader.result as string);
    };
    reader.readAsText(file);
  }

  async function optimizeSvg() {
    if (!svg.trim()) {
      toast.error("Please enter or upload SVG code");
      return;
    }

    setIsOptimizing(true);
    try {
      const res = await fetch("/api/design/optimize-svg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ svg }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to optimize SVG");

      setOptimizedSvg(result.data);
      setStats(result.stats);
      toast.success("SVG optimized successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsOptimizing(false);
    }
  }

  function copyToClipboard() {
    if (optimizedSvg) {
      navigator.clipboard.writeText(optimizedSvg);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function downloadSvg() {
    if (optimizedSvg) {
      const blob = new Blob([optimizedSvg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "optimized.svg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors size={24} weight="bold" className="text-primary" />
            SVG Optimizer
          </CardTitle>
          <CardDescription>
            Optimize and minify your SVG images for better web performance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="code">
            <div className="flex items-center justify-between mb-2">
              <TabsList className="grid w-[200px] grid-cols-2">
                <TabsTrigger value="code">
                  <Code size={16} className="mr-2" /> Code
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <Eye size={16} className="mr-2" /> Preview
                </TabsTrigger>
              </TabsList>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                Upload SVG
              </Button>
            </div>

            <TabsContent value="code">
              <Textarea
                placeholder="Paste your SVG code here..."
                className="min-h-[300px] font-mono text-xs leading-relaxed"
                value={svg}
                onChange={(e) => setSvg(e.target.value)}
              />
            </TabsContent>

            <TabsContent value="preview">
              <div className="flex min-h-[300px] items-center justify-center rounded-md border border-border bg-muted/40 p-10">
                {svg ? (
                  <div className="max-w-full overflow-auto" dangerouslySetInnerHTML={{ __html: svg }} />
                ) : (
                  <p className="text-sm text-muted-foreground">Upload or paste SVG code to see preview</p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <input type="file" ref={fileInputRef} className="hidden" accept=".svg,image/svg+xml" onChange={handleFileUpload} />

          <Button className="w-full h-12 text-lg font-medium" onClick={optimizeSvg} disabled={isOptimizing || !svg.trim()}>
            {isOptimizing ? (
              <>
                <ArrowClockwise size={20} className="mr-2 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Sparkle size={20} className="mr-2" />
                Optimize SVG
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {optimizedSvg && (
        <Card className="border-primary/20 bg-primary/5 animate-fade-in shadow-md overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Optimized SVG</CardTitle>
                {stats && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Reduced by <span className="font-bold text-primary">{stats.percent}%</span> ({formatBytes(stats.saved)} saved)
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-8" onClick={copyToClipboard}>
                  {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button size="sm" className="h-8" onClick={downloadSvg}>
                  <Download size={16} className="mr-2" /> Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="optimized-preview">
              <TabsList className="w-full justify-start rounded-none border-b border-primary/10 bg-transparent px-4">
                <TabsTrigger value="optimized-preview" className="data-[state=active]:bg-primary/10">Preview</TabsTrigger>
                <TabsTrigger value="optimized-code" className="data-[state=active]:bg-primary/10">Code</TabsTrigger>
              </TabsList>
              <TabsContent value="optimized-preview" className="m-0 p-10">
                <div className="flex min-h-[200px] items-center justify-center">
                  <div className="max-w-full overflow-auto" dangerouslySetInnerHTML={{ __html: optimizedSvg }} />
                </div>
              </TabsContent>
              <TabsContent value="optimized-code" className="m-0">
                <Textarea
                  readOnly
                  className="min-h-[300px] border-none font-mono text-[10px] leading-tight focus-visible:ring-0 bg-transparent"
                  value={optimizedSvg}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
