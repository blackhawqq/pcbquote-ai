// Agent 2: Gerber File Parser
// Extracts PCB metadata from Gerber/ZIP files for pre-filling specs

import type { GerberParseResult } from "@/types/pcb";

class GerberParser {
  async parseZip(buffer: Buffer): Promise<GerberParseResult> {
    const warnings: string[] = [];
    const result: GerberParseResult = {
      detectedLayers: 2,
      estimatedWidth: 0,
      estimatedHeight: 0,
      estimatedVias: 0,
      estimatedDrills: 0,
      estimatedTraceWidth: 0.15,
      confidence: 0,
      warnings: [],
    };

    // Detect layer count from file names inside ZIP
    // Common layer file naming conventions
    const layerSignals = {
      copper: ["GTL", "GBL", "G2L", "G3L", "G4L", "IN", "CU", "TOP", "BOT", "F.Cu", "B.Cu"],
      drill: ["DRL", "XLN", "TXT", "DRL"],
      silkscreen: ["GTO", "GBO", "F.SilkS", "B.SilkS"],
      soldermask: ["GTS", "GBS", "F.Mask", "B.Mask"],
    };

    try {
      // Detect ZIP magic bytes
      if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4B) {
        warnings.push("File does not appear to be a valid ZIP archive.");
        result.warnings = warnings;
        return result;
      }

      // Parse ZIP central directory to get file names
      const fileNames = this.extractZipFileNames(buffer);

      let copperLayerCount = 0;
      let hasDrill = false;

      for (const name of fileNames) {
        const upperName = name.toUpperCase();

        // Count copper layers
        if (
          upperName.includes(".GTL") || upperName.includes(".GBL") ||
          upperName.includes("-F.CU") || upperName.includes("-B.CU") ||
          upperName.includes("_TOP") || upperName.includes("_BOT") ||
          upperName.includes("TOP.GER") || upperName.includes("BOT.GER")
        ) {
          copperLayerCount = Math.max(copperLayerCount, upperName.includes("GTL") || upperName.includes("GBL") ? 2 : 2);
        }

        // Inner layers
        if (/G\d+L|IN\d|CU\d/.test(upperName)) {
          const match = upperName.match(/(\d+)/);
          if (match) copperLayerCount = Math.max(copperLayerCount, parseInt(match[1]) * 2);
        }

        if (upperName.includes(".DRL") || upperName.includes(".XLN") || upperName.includes("DRILL")) {
          hasDrill = true;
        }
      }

      result.detectedLayers = copperLayerCount > 0 ? copperLayerCount : 2;
      result.confidence = copperLayerCount > 0 ? 0.85 : 0.3;

      if (!hasDrill) {
        warnings.push("No drill file detected in archive. Drill count may be inaccurate.");
      }

      // Extract dimensions from Gerber content (sample first Gerber file)
      const gerberContent = this.extractFirstGerberContent(buffer, fileNames);
      if (gerberContent) {
        const dims = this.parseGerberDimensions(gerberContent);
        if (dims) {
          result.estimatedWidth = dims.width;
          result.estimatedHeight = dims.height;
          result.confidence = Math.min(0.95, result.confidence + 0.1);
        }

        const vias = this.parseViaCount(gerberContent);
        result.estimatedVias = vias;

        const traceWidth = this.parseMinTraceWidth(gerberContent);
        if (traceWidth > 0) result.estimatedTraceWidth = traceWidth;
      }

    } catch (err) {
      warnings.push("Error parsing Gerber file. Please enter specifications manually.");
    }

    result.warnings = warnings;
    return result;
  }

  private extractZipFileNames(buffer: Buffer): string[] {
    const names: string[] = [];
    // Find ZIP local file header signatures (PK\x03\x04)
    let offset = 0;
    while (offset < buffer.length - 30) {
      if (buffer[offset] === 0x50 && buffer[offset + 1] === 0x4B &&
          buffer[offset + 2] === 0x03 && buffer[offset + 3] === 0x04) {
        const fileNameLength = buffer.readUInt16LE(offset + 26);
        const extraLength = buffer.readUInt16LE(offset + 28);
        const fileName = buffer.slice(offset + 30, offset + 30 + fileNameLength).toString("utf8");
        names.push(fileName);
        const compressedSize = buffer.readUInt32LE(offset + 18);
        offset += 30 + fileNameLength + extraLength + compressedSize;
      } else {
        offset++;
      }
    }
    return names;
  }

  private extractFirstGerberContent(buffer: Buffer, fileNames: string[]): string | null {
    // In a real implementation this would decompress the ZIP entry
    // For now return a minimal parse based on raw bytes
    const content = buffer.toString("ascii", 0, Math.min(buffer.length, 8192));
    if (content.includes("%FS") || content.includes("G04")) return content;
    return null;
  }

  private parseGerberDimensions(content: string): { width: number; height: number } | null {
    const coords: number[] = [];
    const pattern = /X(-?\d+)Y(-?\d+)/g;
    let match;
    const xs: number[] = [];
    const ys: number[] = [];

    while ((match = pattern.exec(content)) !== null && xs.length < 200) {
      xs.push(parseInt(match[1]));
      ys.push(parseInt(match[2]));
    }

    if (xs.length < 4) return null;

    const xRange = Math.max(...xs) - Math.min(...xs);
    const yRange = Math.max(...ys) - Math.min(...ys);

    // Typical Gerber unit is 1/1000 inch or 0.01mm — normalize
    const scale = content.includes("%FSLAX46Y46") ? 0.000001 * 25.4 :
                  content.includes("%FSLAX35Y35") ? 0.00001 * 25.4 : 0.001;

    const width = Math.round(xRange * scale * 10) / 10;
    const height = Math.round(yRange * scale * 10) / 10;

    if (width < 1 || height < 1 || width > 1000 || height > 1000) return null;

    return { width, height };
  }

  private parseViaCount(content: string): number {
    const viaPattern = /(%ADD\d+C,[\d.]+\*%)/g;
    const drillPattern = /T\d+C[\d.]+/g;
    const matches = content.match(drillPattern);
    return matches ? Math.min(matches.length * 8, 500) : 0;
  }

  private parseMinTraceWidth(content: string): number {
    const widthPattern = /C,([\d.]+)\*/g;
    let minWidth = Infinity;
    let match;
    while ((match = widthPattern.exec(content)) !== null) {
      const w = parseFloat(match[1]);
      if (w > 0 && w < minWidth) minWidth = w;
    }
    return minWidth === Infinity ? 0 : minWidth;
  }
}

export const gerberParser = new GerberParser();
