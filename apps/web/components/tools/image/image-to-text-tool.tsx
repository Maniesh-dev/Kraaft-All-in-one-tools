"use client";

import * as React from "react";
import { createWorker } from "tesseract.js";
import { Upload, FileText, Copy, Check, X, ArrowClockwise, Translate } from "@phosphor-icons/react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Textarea } from "@workspace/ui/components/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Label } from "@workspace/ui/components/label";
import { toast } from "sonner";

export function ImageToTextTool() {
  const [image, setImage] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [status, setStatus] = React.useState<string>("");
  const [result, setResult] = React.useState<string>("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [language, setLanguage] = React.useState("eng");
  const [copied, setCopied] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setResult("");
      setProgress(0);
      setStatus("");
    };
    reader.readAsDataURL(file);
  }

  async function performOCR() {
    if (!image) return;

    setIsProcessing(true);
    setProgress(0);
    setStatus("Initializing engine...");

    try {
      const worker = await createWorker(language, 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
            setStatus("Extracting text...");
          }
        },
      });

      const { data: { text } } = await worker.recognize(image);
      setResult(text);
      await worker.terminate();
      toast.success("Text extracted successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to extract text from image");
      setStatus("Error processing image");
    } finally {
      setIsProcessing(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Text copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setImage(null);
    setResult("");
    setProgress(0);
    setStatus("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText size={24} weight="bold" className="text-primary" />
            Image to Text (OCR)
          </CardTitle>
          <CardDescription>
            Extract text from any image using ultra-accurate OCR technology.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!image ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-12 transition-all hover:border-primary/50 hover:bg-primary/5"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                <Upload size={32} />
              </div>
              <p className="text-lg font-medium">Click or drag image to upload</p>
              <p className="mt-1 text-sm text-muted-foreground">PNG, JPG, WEBP, BMP (Max 10MB)</p>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/20">
              <img src={image} alt="Uploaded" className="mx-auto max-h-[400px] object-contain" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute right-4 top-4 h-8 w-8 rounded-full shadow-lg"
                onClick={reset}
              >
                <X size={16} />
              </Button>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label className="flex items-center gap-2">
                <Translate size={18} />
                Detection Language
              </Label>
              <Select value={language} onValueChange={setLanguage} disabled={isProcessing}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eng">English</SelectItem>
                  <SelectItem value="spa">Spanish</SelectItem>
                  <SelectItem value="fra">French</SelectItem>
                  <SelectItem value="deu">German</SelectItem>
                  <SelectItem value="hin">Hindi</SelectItem>
                  <SelectItem value="jpn">Japanese</SelectItem>
                  <SelectItem value="chi_sim">Chinese (Simplified)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="h-10 px-8"
              onClick={performOCR}
              disabled={!image || isProcessing}
            >
              {isProcessing ? (
                <>
                  <ArrowClockwise size={18} className="mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Extract Text"
              )}
            </Button>
          </div>

          {isProcessing && (
            <div className="space-y-2 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-primary">{status}</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div 
                  className="h-full bg-primary transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card className="border-primary/20 animate-fade-in shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Extracted Text</CardTitle>
              <Button variant="ghost" size="sm" onClick={copyToClipboard} className="h-8 gap-2">
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied" : "Copy All"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              readOnly
              value={result}
              className="min-h-[200px] resize-none border-none bg-muted/30 font-serif leading-relaxed focus-visible:ring-0"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline">{result.split(/\s+/).length} Words</Badge>
              <Badge variant="outline">{result.length} Characters</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
