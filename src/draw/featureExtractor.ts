import type { Stroke } from "./strokeCapture";

export const RASTER_SIZE = 32;

type Raster = {
  data: Float32Array;
  width: number;
  height: number;
};

type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type RasterTransform = {
  scale: number;
  toRasterX(x: number): number;
  toRasterY(y: number): number;
};

type Point = {
  x: number;
  y: number;
};

export function strokesToRaster(strokes: Stroke[]): Float32Array {
  return rasterizeStrokes(strokes, RASTER_SIZE).data;
}

function rasterizeStrokes(strokes: Stroke[], size: number): Raster {
  const raster = createEmptyRaster(size);
  const bounds = computeStrokeBounds(strokes);

  if (bounds === null) {
    return raster;
  }

  const transform = createRasterTransform(bounds, size);

  for (const stroke of strokes) {
    rasterizeStroke(raster, transform, stroke);
  }

  return raster;
}

function createEmptyRaster(size: number): Raster {
  return {
    data: new Float32Array(size * size),
    width: size,
    height: size,
  };
}

function computeStrokeBounds(strokes: Stroke[]): Bounds | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const stroke of strokes) {
    for (const point of stroke.points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
  }

  if (!Number.isFinite(minX)) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

function createRasterTransform(bounds: Bounds, size: number): RasterTransform {
  const padding = 8;

  const width = bounds.maxX - bounds.minX + padding * 2;
  const height = bounds.maxY - bounds.minY + padding * 2;
  const scale = size / Math.max(width, height);

  return {
    scale,

    toRasterX(x: number): number {
      return Math.floor((x - bounds.minX + padding) * scale);
    },

    toRasterY(y: number): number {
      return Math.floor((y - bounds.minY + padding) * scale);
    },
  };
}

function rasterizeStroke(
  raster: Raster,
  transform: RasterTransform,
  stroke: Stroke,
): void {
  const lineWidth = stroke.width ?? 3;
  const radius = Math.max(1, Math.round((lineWidth * transform.scale) / 2));

  for (let index = 1; index < stroke.points.length; index += 1) {
    const start = stroke.points[index - 1];
    const end = stroke.points[index];

    rasterizeSegment(raster, transform, start, end, radius);
  }
}

function rasterizeSegment(
  raster: Raster,
  transform: RasterTransform,
  start: Point,
  end: Point,
  radius: number,
): void {
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  const steps = Math.max(2, Math.ceil(distance * transform.scale * 1.5));

  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;

    const x = start.x + (end.x - start.x) * t;
    const y = start.y + (end.y - start.y) * t;

    rasterizeBrushPoint(raster, transform, { x, y }, radius);
  }
}

function rasterizeBrushPoint(
  raster: Raster,
  transform: RasterTransform,
  point: Point,
  radius: number,
): void {
  const x = transform.toRasterX(point.x);
  const y = transform.toRasterY(point.y);

  stampBrush(raster, x, y, radius);
}

function stampBrush(
  raster: Raster,
  centerX: number,
  centerY: number,
  radius: number,
): void {
  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      if (dx * dx + dy * dy > radius * radius) {
        continue;
      }

      setPixel(raster, centerX + dx, centerY + dy);
    }
  }
}

function setPixel(raster: Raster, x: number, y: number): void {
  if (x < 0 || x >= raster.width || y < 0 || y >= raster.height) {
    return;
  }

  raster.data[y * raster.width + x] = 1;
}

export type FeatureVector = number[];

export function extractFromStrokes(strokes: Stroke[]): FeatureVector {
  const raster = rasterizeStrokes(strokes, RASTER_SIZE);
  const flat = Array.from(raster.data);
  const extras = computeExtras(strokes, raster);
  return [...flat, ...extras];
}

function computeExtras(strokes: Stroke[], raster: Raster): number[] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const stroke of strokes) {
    for (const point of stroke.points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
  }

  const strokeCount = strokes.length;
  const aspectRatio =
    Number.isFinite(minX) && maxY - minY > 0
      ? (maxX - minX) / (maxY - minY)
      : 1;

  let darkPixels = 0;
  for (let index = 0; index < raster.data.length; index += 1) {
    if (raster.data[index] > 0) {
      darkPixels += 1;
    }
  }
  const inkDensity = darkPixels / raster.data.length;

  return [strokeCount / 20, aspectRatio, inkDensity];
}
