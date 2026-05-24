"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  Upload, FileUp, X, Zap, Cpu, Layers, Ruler, Palette,
  TestTube, Package, CheckCircle2, AlertCircle, Pencil, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/use-toast";
import { bytesToMB, cn } from "@/lib/utils";

const SURFACE_FINISHES = [
  { value: "HASL", label: "HASL (Hot Air Solder Leveling)" },
  { value: "LEAD_FREE_HASL", label: "Lead-Free HASL" },
  { value: "ENIG", label: "ENIG (Electroless Nickel Gold)" },
  { value: "OSP", label: "OSP (Organic Solderability Preservative)" },
  { value: "HARD_GOLD", label: "Hard Gold Plating" },
  { value: "IMMERSION_SILVER", label: "Immersion Silver" },
  { value: "IMMERSION_TIN", label: "Immersion Tin" },
];

const SOLDER_COLORS = ["GREEN", "RED", "BLUE", "BLACK", "WHITE", "YELLOW", "PURPLE", "MATTE_BLACK", "MATTE_GREEN"];

const defaultSpecs = {
  width: 0, height: 0, layers: 2, thickness: 1.6, copperWeight: 1,
  surfaceFinish: "HASL", solderMaskColor: "GREEN", silkscreenColor: "WHITE",
  viaCount: 50, drillCount: 100, minTraceWidth: 0.15, minSpacing: 0.15,
  quantity: 0, panelization: false,
  panelRows: undefined as number | undefined,
  panelCols: undefined as number | undefined,
  smtAssembly: false, throughHoleAssembly: false, componentCount: 0,
  smtComponentCount: 0, thComponentCount: 0,
  electricalTest: false, aoiInspection: false, xrayInspection: false,
  currency: "USD", customerNotes: "",
};

type Specs = typeof defaultSpecs;
type Phase = "upload" | "form";
type Errors = Partial<Record<keyof Specs, string>>;

const LABEL: Record<string, string> = {
  layers: "Layer Count", width: "Width (mm)", height: "Height (mm)",
  viaCount: "Via Count", drillCount: "Drill Count", minTraceWidth: "Min Trace Width (mm)",
};

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
      <AlertCircle className="h-3 w-3 shrink-0" />{msg}
    </p>
  );
}

function fieldClass(error?: string) {
  return error ? "border-destructive ring-1 ring-destructive focus:ring-destructive" : "";
}

function validate(specs: Specs): Errors {
  const e: Errors = {};
  if (!specs.width || specs.width <= 0) e.width = "Board width is required";
  else if (specs.width > 500) e.width = "Max board width is 500 mm";
  if (!specs.height || specs.height <= 0) e.height = "Board height is required";
  else if (specs.height > 500) e.height = "Max board height is 500 mm";
  if (!specs.quantity || specs.quantity < 1) e.quantity = "Quantity must be at least 1";
  else if (specs.quantity > 10000) e.quantity = "Max quantity is 10,000";
  if (!specs.thickness || specs.thickness <= 0) e.thickness = "Thickness is required";
  if (!specs.copperWeight || specs.copperWeight <= 0) e.copperWeight = "Copper weight is required";
  if (!specs.minTraceWidth || specs.minTraceWidth <= 0) e.minTraceWidth = "Min trace width is required";
  if (!specs.minSpacing || specs.minSpacing <= 0) e.minSpacing = "Min spacing is required";
  if (specs.smtAssembly && (!specs.smtComponentCount || specs.smtComponentCount <= 0))
    e.smtComponentCount = "Enter SMT component count";
  if (specs.throughHoleAssembly && (!specs.thComponentCount || specs.thComponentCount <= 0))
    e.thComponentCount = "Enter TH component count";
  return e;
}

export default function UploadPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("upload");
  const [specs, setSpecs] = useState<Specs>(defaultSpecs);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; url: string } | null>(null);
  const [parsedKeys, setParsedKeys] = useState<Set<string>>(new Set());
  const [editingDetected, setEditingDetected] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const errorBannerRef = useRef<HTMLDivElement>(null);

  const update = <K extends keyof Specs>(key: K, value: Specs[K]) => {
    setSpecs((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Upload failed", description: data.error, variant: "destructive" });
        return;
      }

      setUploadedFile({ name: file.name, size: file.size, url: data.file.url });

      const detected = new Set<string>();
      if (data.parsedSpecs) {
        const p = data.parsedSpecs;
        setConfidence(p.confidence ?? 0);
        if (p.detectedLayers && p.detectedLayers > 0) {
          update("layers", p.detectedLayers); detected.add("layers");
        }
        if (p.estimatedWidth > 0) {
          update("width", Math.round(p.estimatedWidth)); detected.add("width");
        }
        if (p.estimatedHeight > 0) {
          update("height", Math.round(p.estimatedHeight)); detected.add("height");
        }
        if (p.estimatedVias > 0) {
          update("viaCount", p.estimatedVias); detected.add("viaCount");
        }
        if (p.estimatedDrills > 0) {
          update("drillCount", p.estimatedDrills); detected.add("drillCount");
        }
        if (p.estimatedTraceWidth > 0) {
          update("minTraceWidth", p.estimatedTraceWidth); detected.add("minTraceWidth");
        }
      }

      setParsedKeys(detected);
      setPhase("form");

      if (detected.size > 0) {
        toast({ title: `${detected.size} fields auto-detected`, description: "Fill in the remaining details below." });
      } else {
        toast({ title: "File uploaded", description: "Please fill in the PCB specifications." });
      }
    } catch {
      toast({ title: "Upload error", description: "Could not connect to server. Try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/zip": [".zip"],
      "application/octet-stream": [".gbr", ".ger", ".gtl", ".gbl", ".drl"],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // ── Validate ────────────────────────────────────────────────────────────
    const errs = validate(specs);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setTimeout(() => {
        errorBannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      toast({
        title: `${Object.keys(errs).length} field${Object.keys(errs).length > 1 ? "s" : ""} need attention`,
        description: "Please fill in the highlighted fields.",
        variant: "destructive",
      });
      return;
    }

    setErrors({});
    setSubmitting(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const payload = {
        ...specs,
        ...(uploadedFile ? { fileUrl: uploadedFile.url, fileName: uploadedFile.name, fileSize: uploadedFile.size } : {}),
      };

      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "LIMIT_REACHED") {
          toast({ title: "Limit reached", description: "Upgrade to Pro for unlimited quotes.", variant: "destructive" });
        } else {
          toast({ title: "Quote failed", description: data.error ?? "Unknown error", variant: "destructive" });
        }
      } else {
        router.push(`/quotes/${data.quote.referenceNo}`);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        toast({ title: "Request timed out", description: "Server took too long. Please try again.", variant: "destructive" });
      } else {
        toast({ title: "Network error", description: "Could not reach the server. Check your connection.", variant: "destructive" });
      }
    } finally {
      clearTimeout(timeout);
      setSubmitting(false);
    }
  }

  // ─── Phase: Upload ────────────────────────────────────────────────────────
  if (phase === "upload") {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">New PCB Quote</h1>
          <p className="text-muted-foreground mt-1">
            Upload your Gerber file — we&apos;ll extract specs automatically
          </p>
        </div>

        <Card className="glass">
          <CardContent className="pt-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-secondary/50"
              }`}
            >
              <input {...getInputProps()} />
              {uploading ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <div>
                    <p className="font-medium">Analyzing Gerber file…</p>
                    <p className="text-sm text-muted-foreground mt-1">Extracting layers, dimensions, via count</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold mb-1">
                      {isDragActive ? "Drop your Gerber file here" : "Drag & drop your Gerber file"}
                    </p>
                    <p className="text-muted-foreground">Supports ZIP, GBR, GER, GTL, GBL · Max 50MB</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground mt-2">
                    {["Layer count", "Board dimensions", "Via count", "Trace width", "Drill count"].map((f) => (
                      <span key={f} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-full">
                        <Zap className="h-3 w-3 text-primary" /> {f}
                      </span>
                    ))}
                  </div>
                  <Button variant="gradient" size="lg" className="mt-2 pointer-events-none">
                    <FileUp className="h-4 w-4" /> Choose File
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setPhase("form")}
                className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
              >
                Skip file upload — enter specs manually
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Phase: Form ─────────────────────────────────────────────────────────
  const needsManual = (key: string) => !parsedKeys.has(key);
  const errorCount = Object.keys(errors).length;

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">New PCB Quote</h1>
          <p className="text-muted-foreground mt-1">
            {parsedKeys.size > 0
              ? `${parsedKeys.size} fields auto-detected — fill in the remaining details`
              : "Enter your PCB specifications"}
          </p>
        </div>
        {uploadedFile && (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 text-sm">
            <FileUp className="h-4 w-4 text-green-400" />
            <span className="font-medium text-green-400 truncate max-w-[180px]">{uploadedFile.name}</span>
            <button
              onClick={() => { setUploadedFile(null); setParsedKeys(new Set()); setPhase("upload"); setErrors({}); }}
              className="text-muted-foreground hover:text-destructive ml-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Error summary banner ──────────────────────────────────────────── */}
      {errorCount > 0 && (
        <div
          ref={errorBannerRef}
          className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded-xl p-4"
        >
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive text-sm">
              {errorCount} field{errorCount > 1 ? "s" : ""} need{errorCount === 1 ? "s" : ""} to be filled in
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              The highlighted fields below are required to generate an accurate quote.
            </p>
          </div>
        </div>
      )}

      {/* ── Detected from Gerber ─────────────────────────────────────────── */}
      {parsedKeys.size > 0 && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-green-400 text-base">
                <CheckCircle2 className="h-5 w-5" />
                Detected from Gerber file
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs font-normal">
                  {Math.round(confidence * 100)}% confidence
                </Badge>
              </CardTitle>
              <button
                type="button"
                onClick={() => setEditingDetected(!editingDetected)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                {editingDetected ? "Done" : "Edit values"}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {editingDetected ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {parsedKeys.has("layers") && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Layer Count</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={specs.layers}
                      onChange={(e) => update("layers", parseInt(e.target.value))}
                    >
                      {[1, 2, 4, 6, 8, 10, 12, 16, 20, 24, 32].map((l) => (
                        <option key={l} value={l}>{l} Layer{l > 1 ? "s" : ""}</option>
                      ))}
                    </select>
                  </div>
                )}
                {parsedKeys.has("width") && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Width (mm)</label>
                    <Input type="number" min={5} max={500} value={specs.width}
                      onChange={(e) => update("width", parseFloat(e.target.value))} />
                  </div>
                )}
                {parsedKeys.has("height") && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Height (mm)</label>
                    <Input type="number" min={5} max={500} value={specs.height}
                      onChange={(e) => update("height", parseFloat(e.target.value))} />
                  </div>
                )}
                {parsedKeys.has("viaCount") && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Via Count</label>
                    <Input type="number" min={0} value={specs.viaCount}
                      onChange={(e) => update("viaCount", parseInt(e.target.value))} />
                  </div>
                )}
                {parsedKeys.has("drillCount") && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Drill Count</label>
                    <Input type="number" min={0} value={specs.drillCount}
                      onChange={(e) => update("drillCount", parseInt(e.target.value))} />
                  </div>
                )}
                {parsedKeys.has("minTraceWidth") && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Min Trace Width (mm)</label>
                    <Input type="number" min={0.05} max={5} step={0.01} value={specs.minTraceWidth}
                      onChange={(e) => update("minTraceWidth", parseFloat(e.target.value))} />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {Array.from(parsedKeys).map((key) => (
                  <div key={key} className="flex items-center gap-2 bg-background border border-green-500/20 rounded-lg px-3 py-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
                    <span className="text-xs text-muted-foreground">{LABEL[key] ?? key}:</span>
                    <span className="text-sm font-semibold">
                      {key === "layers" ? `${specs.layers} layers`
                        : key === "width" ? `${specs.width} mm`
                        : key === "height" ? `${specs.height} mm`
                        : key === "viaCount" ? specs.viaCount
                        : key === "drillCount" ? specs.drillCount
                        : key === "minTraceWidth" ? `${specs.minTraceWidth} mm`
                        : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Manual fields form ───────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>

        {/* Gerber-detectable fields that were NOT detected */}
        {(needsManual("layers") || needsManual("width") || needsManual("height") ||
          needsManual("viaCount") || needsManual("drillCount") || needsManual("minTraceWidth")) && (
          <Card className={cn("glass", (errors.width || errors.height) && "border-destructive/40")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-4 w-4 text-primary" />
                Board Layout
                {parsedKeys.size > 0 && (
                  <span className="flex items-center gap-1 text-xs font-normal text-amber-400 ml-1">
                    <AlertCircle className="h-3.5 w-3.5" /> Not found in Gerber
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {needsManual("layers") && (
                <div id="field-layers">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Layer Count</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={specs.layers}
                    onChange={(e) => update("layers", parseInt(e.target.value))}
                  >
                    {[1, 2, 4, 6, 8, 10, 12, 16, 20, 24, 32].map((l) => (
                      <option key={l} value={l}>{l} Layer{l > 1 ? "s" : ""}</option>
                    ))}
                  </select>
                </div>
              )}
              {needsManual("width") && (
                <div id="field-width">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Width (mm) {errors.width && <span className="text-destructive">*</span>}
                  </label>
                  <Input
                    type="number" min={5} max={500} step={1}
                    placeholder="e.g. 80"
                    value={specs.width || ""}
                    onChange={(e) => update("width", parseFloat(e.target.value) || 0)}
                    className={fieldClass(errors.width)}
                    required
                  />
                  <FieldError msg={errors.width} />
                </div>
              )}
              {needsManual("height") && (
                <div id="field-height">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Height (mm) {errors.height && <span className="text-destructive">*</span>}
                  </label>
                  <Input
                    type="number" min={5} max={500} step={1}
                    placeholder="e.g. 60"
                    value={specs.height || ""}
                    onChange={(e) => update("height", parseFloat(e.target.value) || 0)}
                    className={fieldClass(errors.height)}
                    required
                  />
                  <FieldError msg={errors.height} />
                </div>
              )}
              {needsManual("viaCount") && (
                <div id="field-viaCount">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Via Count</label>
                  <Input type="number" min={0} value={specs.viaCount}
                    onChange={(e) => update("viaCount", parseInt(e.target.value) || 0)} />
                </div>
              )}
              {needsManual("drillCount") && (
                <div id="field-drillCount">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Drill Count</label>
                  <Input type="number" min={0} value={specs.drillCount}
                    onChange={(e) => update("drillCount", parseInt(e.target.value) || 0)} />
                </div>
              )}
              {needsManual("minTraceWidth") && (
                <div id="field-minTraceWidth">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Min Trace Width (mm) {errors.minTraceWidth && <span className="text-destructive">*</span>}
                  </label>
                  <Input
                    type="number" min={0.05} max={5} step={0.01}
                    value={specs.minTraceWidth}
                    onChange={(e) => update("minTraceWidth", parseFloat(e.target.value) || 0)}
                    className={fieldClass(errors.minTraceWidth)}
                  />
                  <FieldError msg={errors.minTraceWidth} />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Board Details — always manual */}
        <Card className={cn("glass", (errors.thickness || errors.quantity || errors.copperWeight || errors.minSpacing) && "border-destructive/40")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Ruler className="h-4 w-4 text-primary" /> Board Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div id="field-thickness">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Thickness (mm) {errors.thickness && <span className="text-destructive">*</span>}
              </label>
              <select
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                  errors.thickness && "border-destructive ring-1 ring-destructive"
                )}
                value={specs.thickness}
                onChange={(e) => update("thickness", parseFloat(e.target.value))}
              >
                {[0.4, 0.6, 0.8, 1.0, 1.2, 1.6, 2.0, 2.4, 3.2].map((t) => (
                  <option key={t} value={t}>{t} mm</option>
                ))}
              </select>
              <FieldError msg={errors.thickness} />
            </div>
            <div id="field-quantity">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Quantity (pcs) {errors.quantity && <span className="text-destructive">*</span>}
              </label>
              <Input
                type="number" min={1} max={10000} step={1}
                placeholder="e.g. 10"
                value={specs.quantity || ""}
                onChange={(e) => update("quantity", parseInt(e.target.value) || 0)}
                className={fieldClass(errors.quantity)}
                required
              />
              <FieldError msg={errors.quantity} />
            </div>
            <div id="field-copperWeight">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Copper Weight (oz) {errors.copperWeight && <span className="text-destructive">*</span>}
              </label>
              <select
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                  errors.copperWeight && "border-destructive ring-1 ring-destructive"
                )}
                value={specs.copperWeight}
                onChange={(e) => update("copperWeight", parseFloat(e.target.value))}
              >
                {[0.5, 1, 2, 3, 4].map((w) => (
                  <option key={w} value={w}>{w} oz</option>
                ))}
              </select>
              <FieldError msg={errors.copperWeight} />
            </div>
            <div id="field-minSpacing">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Min Spacing (mm) {errors.minSpacing && <span className="text-destructive">*</span>}
              </label>
              <Input
                type="number" min={0.05} max={5} step={0.01}
                value={specs.minSpacing}
                onChange={(e) => update("minSpacing", parseFloat(e.target.value) || 0)}
                className={fieldClass(errors.minSpacing)}
              />
              <FieldError msg={errors.minSpacing} />
            </div>
          </CardContent>
        </Card>

        {/* Finish & Colors */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4 text-primary" /> Finish & Colors
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Surface Finish</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={specs.surfaceFinish}
                onChange={(e) => update("surfaceFinish", e.target.value)}
              >
                {SURFACE_FINISHES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Solder Mask Color</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={specs.solderMaskColor}
                onChange={(e) => update("solderMaskColor", e.target.value)}
              >
                {SOLDER_COLORS.map((c) => (
                  <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Silkscreen Color</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={specs.silkscreenColor}
                onChange={(e) => update("silkscreenColor", e.target.value)}
              >
                {["WHITE", "BLACK", "YELLOW"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Assembly */}
        <Card className={cn("glass", (errors.smtComponentCount || errors.thComponentCount) && "border-destructive/40")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="h-4 w-4 text-primary" /> Assembly Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={specs.smtAssembly}
                  onChange={(e) => update("smtAssembly", e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary" />
                <span className="text-sm font-medium">SMT Assembly</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={specs.throughHoleAssembly}
                  onChange={(e) => update("throughHoleAssembly", e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary" />
                <span className="text-sm font-medium">Through-Hole Assembly</span>
              </label>
            </div>
            {(specs.smtAssembly || specs.throughHoleAssembly) && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                {specs.smtAssembly && (
                  <div id="field-smtComponentCount">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      SMT Components {errors.smtComponentCount && <span className="text-destructive">*</span>}
                    </label>
                    <Input
                      type="number" min={0}
                      value={specs.smtComponentCount || ""}
                      placeholder="e.g. 50"
                      onChange={(e) => update("smtComponentCount", parseInt(e.target.value) || 0)}
                      className={fieldClass(errors.smtComponentCount)}
                    />
                    <FieldError msg={errors.smtComponentCount} />
                  </div>
                )}
                {specs.throughHoleAssembly && (
                  <div id="field-thComponentCount">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      TH Components {errors.thComponentCount && <span className="text-destructive">*</span>}
                    </label>
                    <Input
                      type="number" min={0}
                      value={specs.thComponentCount || ""}
                      placeholder="e.g. 20"
                      onChange={(e) => update("thComponentCount", parseInt(e.target.value) || 0)}
                      className={fieldClass(errors.thComponentCount)}
                    />
                    <FieldError msg={errors.thComponentCount} />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Testing */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TestTube className="h-4 w-4 text-primary" /> Testing & Inspection
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: "electricalTest", label: "Electrical Test (Flying Probe)" },
              { key: "aoiInspection", label: "AOI Inspection" },
              { key: "xrayInspection", label: "X-Ray Inspection" },
            ].map((t) => (
              <label key={t.key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(specs as Record<string, unknown>)[t.key] as boolean}
                  onChange={(e) => update(t.key as keyof Specs, e.target.checked as never)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-sm">{t.label}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Options */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-primary" /> Options
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Quote Currency</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={specs.currency}
                onChange={(e) => update("currency", e.target.value)}
              >
                {["USD", "EUR", "GBP", "JPY", "CNY", "CAD", "AUD", "INR", "TRY"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes (optional)</label>
              <Input
                placeholder="Special requirements, tolerances, etc."
                value={specs.customerNotes}
                onChange={(e) => update("customerNotes", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button
            type="submit"
            size="xl"
            variant="gradient"
            className="flex-1"
            loading={submitting}
            disabled={submitting}
          >
            <Zap className="h-5 w-5" />
            {submitting ? "Calculating…" : "Generate AI Quote"}
          </Button>
          {!uploadedFile && (
            <Button
              type="button"
              variant="outline"
              size="xl"
              onClick={() => setPhase("upload")}
              className="gap-2"
            >
              <Upload className="h-4 w-4" /> Upload Gerber
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
