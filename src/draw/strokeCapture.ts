export type StrokePoint = { x: number; y: number };

export type Stroke = {
  points: StrokePoint[];
  width?: number;
};

export type StrokeCapture = {
  attach(canvas: HTMLCanvasElement): void;
  detach(): void;
  clear(): void;
  undo(): void;
  getStrokes(): Stroke[];
};

export function createStrokeCapture(): StrokeCapture {
  let canvas: HTMLCanvasElement | null = null;
  let context: CanvasRenderingContext2D | null = null;
  let strokes: Stroke[] = [];
  let currentStroke: Stroke | null = null;
  let drawing = false;

  const capture: StrokeCapture = {
    attach(nextCanvas) {
      capture.detach();
      canvas = nextCanvas;
      context = canvas.getContext("2d");
      redraw();
      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointermove", onPointerMove);
      canvas.addEventListener("pointerup", onPointerUp);
    },

    detach() {
      if (!canvas) {
        return;
      }

      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);

      canvas = null;
      context = null;
      currentStroke = null;
      drawing = false;
    },

    clear() {
      strokes = [];
      currentStroke = null;
      drawing = false;
      redraw();
    },

    undo() {
      strokes = strokes.slice(0, -1);
      currentStroke = null;
      drawing = false;
      redraw();
    },

    getStrokes() {
      return strokes.map((stroke) => ({
        points: stroke.points.map((point) => ({ ...point })),
      }));
    },
  };

  function getPoint(event: PointerEvent): StrokePoint {
    const rect = canvas!.getBoundingClientRect();
    const scaleX = canvas!.width / rect.width;
    const scaleY = canvas!.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  function onPointerDown(event: PointerEvent) {
    if (!canvas) {
      return;
    }

    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    drawing = true;
    currentStroke = { points: [getPoint(event)] };
    redraw();
  }

  function onPointerMove(event: PointerEvent) {
    if (!drawing || !currentStroke) {
      return;
    }

    event.preventDefault();
    currentStroke.points.push(getPoint(event));
    redraw();
  }

  function onPointerUp(event: PointerEvent) {
    if (!drawing || !currentStroke) {
      return;
    }

    event.preventDefault();
    drawing = false;

    if (currentStroke.points.length > 0) {
      strokes.push(currentStroke);
    }

    currentStroke = null;
    redraw();
  }

  function redraw() {
    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokes) {
      drawStroke(context, stroke);
    }

    if (currentStroke) {
      drawStroke(context, currentStroke);
    }
  }

  function drawStroke(context: CanvasRenderingContext2D, stroke: Stroke) {
    if (stroke.points.length === 0) {
      return;
    }

    context.lineWidth = 3;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length; i += 1) {
      context.lineTo(stroke.points[i].x, stroke.points[i].y);
    }

    context.stroke();
  }

  return capture;
}
