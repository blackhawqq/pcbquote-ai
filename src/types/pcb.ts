export interface PCBSpecs {
  width: number;
  height: number;
  layers: number;
  thickness: number;
  copperWeight: number;
  surfaceFinish: SurfaceFinishType;
  solderMaskColor: SolderMaskColorType;
  silkscreenColor: SilkscreenColorType;
  viaCount: number;
  drillCount: number;
  minTraceWidth: number;
  minSpacing: number;
  quantity: number;
  panelization: boolean;
  panelRows?: number;
  panelCols?: number;
  smtAssembly: boolean;
  throughHoleAssembly: boolean;
  componentCount: number;
  smtComponentCount: number;
  thComponentCount: number;
  electricalTest: boolean;
  aoiInspection: boolean;
  xrayInspection: boolean;
  currency: string;
  customerNotes?: string;
}

export interface PCBEstimation {
  materialCost: number;
  manufacturingCost: number;
  assemblyCost: number;
  testingCost: number;
  packagingCost: number;
  shippingCost: number;
  totalCost: number;
  suggestedPrice: number;
  profitMargin: number;
  leadTimeDays: number;
  yieldEstimate: number;
  complexityScore: number;
  dfmScore: number;
  dfmWarnings: string[];
  manufacturingNotes: string[];
  optimizationSuggestions: string[];
  riskAnalysis: RiskAnalysis;
  breakdown: CostBreakdown;
}

export interface CostBreakdown {
  rawMaterial: number;
  boardFabrication: number;
  drilling: number;
  surfaceFinish: number;
  solderMask: number;
  silkscreen: number;
  smtPlacement: number;
  throughHolePlacement: number;
  soldering: number;
  electricalTest: number;
  aoiInspection: number;
  xrayInspection: number;
  scrapAllowance: number;
  packaging: number;
  shipping: number;
  machineSetup: number;
}

export interface RiskAnalysis {
  overallRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risks: Risk[];
}

export interface Risk {
  category: string;
  level: "LOW" | "MEDIUM" | "HIGH";
  description: string;
  recommendation: string;
}

export interface DFMResult {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  warnings: DFMWarning[];
  passed: DFMCheck[];
}

export interface DFMWarning {
  code: string;
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  message: string;
  field?: string;
  recommendation: string;
}

export interface DFMCheck {
  code: string;
  message: string;
}

export type SurfaceFinishType =
  | "HASL"
  | "LEAD_FREE_HASL"
  | "ENIG"
  | "OSP"
  | "HARD_GOLD"
  | "IMMERSION_SILVER"
  | "IMMERSION_TIN";

export type SolderMaskColorType =
  | "GREEN"
  | "RED"
  | "BLUE"
  | "BLACK"
  | "WHITE"
  | "YELLOW"
  | "PURPLE"
  | "MATTE_BLACK"
  | "MATTE_GREEN";

export type SilkscreenColorType = "WHITE" | "BLACK" | "YELLOW";

export interface GerberParseResult {
  detectedLayers: number;
  estimatedWidth: number;
  estimatedHeight: number;
  estimatedVias: number;
  estimatedDrills: number;
  estimatedTraceWidth: number;
  confidence: number;
  warnings: string[];
}
