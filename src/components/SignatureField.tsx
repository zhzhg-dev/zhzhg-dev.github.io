import { useEffect, useId, useRef, useState } from "react";
import "./signature-field.css";

type Mode = "think" | "build" | "explain";
type Vector = [number, number, number];
type Engine = {
  select: (mode: Mode) => void;
  point: (x: number, y: number) => void;
};

const modes: { id: Mode; label: string; description: string }[] = [
  { id: "think", label: "Think", description: "Mathematics taught me to look for the structure inside a question." },
  { id: "build", label: "Build", description: "I turn that structure into AI products people can actually use." },
  { id: "explain", label: "Explain", description: "Teaching reminds me that a good idea should make sense to someone else." },
];

const along = 192;
const across = 28;
const stride = across + 1;
const pointCount = (along + 1) * stride;
const tau = Math.PI * 2;

function normalize([x, y, z]: Vector): Vector {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
}

function cross(a: Vector, b: Vector): Vector {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function center(mode: Mode, t: number): Vector {
  if (mode === "build") return [1.58 * Math.cos(t), 1.22 * Math.sin(t), .65 * Math.sin(2 * t)];
  if (mode === "explain") return [1.6 * Math.sin(t), 1.17 * Math.sin(2 * t), .65 * Math.cos(t)];
  const radius = 1.34 + .43 * Math.cos(3 * t);
  return [radius * Math.cos(2 * t), radius * Math.sin(2 * t), .67 * Math.sin(3 * t)];
}

function makeSurface(mode: Mode) {
  const result = new Float32Array(pointCount * 3);
  for (let i = 0; i <= along; i++) {
    const t = i / along * tau;
    const c = center(mode, t);
    const before = center(mode, t - .002);
    const after = center(mode, t + .002);
    const tangent = normalize([after[0] - before[0], after[1] - before[1], after[2] - before[2]]);
    const side = normalize(cross(tangent, [0, 0, 1]));
    const up = normalize(cross(side, tangent));
    const twist = mode === "build" ? t + .25 * Math.sin(2 * t) + .5
      : mode === "explain" ? t + .65 * Math.sin(t) - .3
        : t + .18 * Math.sin(3 * t);
    const width = (mode === "build" ? .46 : .37) * (1 + .13 * Math.sin(3 * t + .4));
    const cosine = Math.cos(twist);
    const sine = Math.sin(twist);
    for (let j = 0; j <= across; j++) {
      const v = j / across * 2 - 1;
      const camber = .12 * (1 - v * v);
      const index = (i * stride + j) * 3;
      for (let k = 0; k < 3; k++) {
        result[index + k] = c[k] + (side[k] * cosine + up[k] * sine) * v * width
          + (up[k] * cosine - side[k] * sine) * camber;
      }
    }
  }
  // Full-turn frames and an identical final row keep the domed cross-section closed.
  result.set(result.subarray(0, stride * 3), along * stride * 3);
  return result;
}

function ease(value: number) {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, value)), 3);
}

function mountField(canvas: HTMLCanvasElement, stage: HTMLElement): Engine & { dispose: () => void } {
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return { select: () => {}, point: () => {}, dispose: () => {} };
  const ctx = context;
  const surfaces = { think: makeSurface("think"), build: makeSurface("build"), explain: makeSurface("explain") };
  const source = new Float32Array(surfaces.think);
  const current = new Float32Array(source);
  const rotated = new Float32Array(source.length);
  const projected = new Float32Array(pointCount * 2);
  const colors = new Float32Array(source.length);
  const luminance = new Float32Array(pointCount);
  const faces: { a: number; b: number; c: number; d: number; depth: number }[] = [];
  for (let i = 0; i < along; i++) {
    for (let j = 0; j < across; j++) {
      const a = i * stride + j, b = a + stride;
      faces.push({ a, b, c: b + 1, d: a + 1, depth: 0 });
    }
  }
  let target = surfaces.think;
  let width = 0;
  let height = 0;
  let frame = 0;
  let disposed = false;
  let inView = true;
  let start = performance.now();
  let morphStart = start;
  let morphing = false;
  let entered = false;
  let pointerX = 0;
  let pointerY = 0;
  let viewX = 0;
  let viewY = 0;
  const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = reduceQuery.matches;
  const light = normalize([-.45, .75, 1]);
  const halfLight = normalize([light[0], light[1], light[2] + 1]);

  function sample(now: number) {
    const amount = reduced ? 1 : ease((now - morphStart) / 920);
    for (let i = 0; i < current.length; i++) current[i] = source[i] + (target[i] - source[i]) * amount;
    if (amount === 1) morphing = false;
  }

  function draw(now: number) {
    sample(now);
    const arrival = reduced || entered ? 1 : ease((now - start) / 950);
    if (arrival === 1) entered = true;
    const pitch = -.52 + viewY;
    const yaw = -.37 + viewX;
    const roll = -.2;
    const cx = Math.cos(pitch), sx = Math.sin(pitch);
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cz = Math.cos(roll), sz = Math.sin(roll);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < pointCount; i++) {
      const index = i * 3;
      const x = current[index], y = current[index + 1], z = current[index + 2];
      const ry = y * cx - z * sx;
      const rz = y * sx + z * cx;
      const rx = x * cy + rz * sy;
      const depth = -x * sy + rz * cy;
      const px = rx * cz - ry * sz;
      const py = rx * sz + ry * cz;
      rotated[index] = px;
      rotated[index + 1] = py;
      rotated[index + 2] = depth;
      const perspective = 6.8 / (6.8 - depth);
      projected[i * 2] = px * perspective;
      projected[i * 2 + 1] = -py * perspective;
      minX = Math.min(minX, px * perspective);
      maxX = Math.max(maxX, px * perspective);
      minY = Math.min(minY, -py * perspective);
      maxY = Math.max(maxY, -py * perspective);
    }
    const scale = Math.min(width * .87 / (maxX - minX), height * .77 / (maxY - minY)) * (.96 + arrival * .04);
    const offsetX = width * .5 - (minX + maxX) * .5 * scale;
    const offsetY = height * .45 - (minY + maxY) * .5 * scale + (1 - arrival) * 12;
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = arrival;
    ctx.save();
    ctx.translate(width * .5, height * .88);
    ctx.scale(1, .19);
    const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, width * .34);
    shadow.addColorStop(0, "rgba(70, 30, 49, .13)");
    shadow.addColorStop(.5, "rgba(70, 30, 49, .055)");
    shadow.addColorStop(1, "rgba(70, 30, 49, 0)");
    ctx.fillStyle = shadow;
    ctx.fillRect(-width * .38, -width * .38, width * .76, width * .76);
    ctx.restore();

    // Neighbouring patches share vertex normals, including both sides of the seam.
    for (let i = 0; i <= along; i++) {
      const previous = i === 0 ? along - 1 : i - 1;
      const next = i === along ? 1 : i + 1;
      for (let j = 0; j <= across; j++) {
        const vertex = i * stride + j;
        const index = vertex * 3;
        const before = (previous * stride + j) * 3;
        const after = (next * stride + j) * 3;
        const left = (i * stride + Math.max(0, j - 1)) * 3;
        const right = (i * stride + Math.min(across, j + 1)) * 3;
        const ux = rotated[after] - rotated[before];
        const uy = rotated[after + 1] - rotated[before + 1];
        const uz = rotated[after + 2] - rotated[before + 2];
        const vx = rotated[right] - rotated[left];
        const vy = rotated[right + 1] - rotated[left + 1];
        const vz = rotated[right + 2] - rotated[left + 2];
        let nx = uy * vz - uz * vy;
        let ny = uz * vx - ux * vz;
        let nz = ux * vy - uy * vx;
        const normalLength = Math.hypot(nx, ny, nz) || 1;
        const backside = nz < 0;
        const direction = backside ? -1 / normalLength : 1 / normalLength;
        nx *= direction;
        ny *= direction;
        nz *= direction;
        const diffuse = Math.max(0, nx * light[0] + ny * light[1] + nz * light[2]);
        const reflected = Math.max(0, nx * halfLight[0] + ny * halfLight[1] + nz * halfLight[2]);
        const specular = Math.pow(reflected, 24) * .66;
        const shade = .24 + diffuse * .76;
        const back = backside ? .9 : 1;
        const red = (48 + shade * 69) * back;
        const green = (17 + shade * 31) * back;
        const blue = (35 + shade * 44) * back;
        colors[index] = red + (238 - red) * specular;
        colors[index + 1] = green + (192 - green) * specular;
        colors[index + 2] = blue + (205 - blue) * specular;
        luminance[vertex] = colors[index] * .2126 + colors[index + 1] * .7152 + colors[index + 2] * .0722;
      }
    }
    for (const face of faces) {
      face.depth = (rotated[face.a * 3 + 2] + rotated[face.b * 3 + 2] + rotated[face.c * 3 + 2] + rotated[face.d * 3 + 2]) / 4;
    }
    faces.sort((a, b) => a.depth - b.depth);
    ctx.lineWidth = .65;
    ctx.lineJoin = "round";
    const colorAt = (index: number) => `rgb(${Math.round(colors[index * 3])},${Math.round(colors[index * 3 + 1])},${Math.round(colors[index * 3 + 2])})`;
    for (const face of faces) {
      const ax = projected[face.a * 2], ay = projected[face.a * 2 + 1];
      const bx = projected[face.b * 2], by = projected[face.b * 2 + 1];
      const dx = projected[face.d * 2], dy = projected[face.d * 2 + 1];
      const ux = bx - ax, uy = by - ay, vx = dx - ax, vy = dy - ay;
      const du = (luminance[face.b] + luminance[face.c] - luminance[face.a] - luminance[face.d]) * .5;
      const dv = (luminance[face.d] + luminance[face.c] - luminance[face.a] - luminance[face.b]) * .5;
      const determinant = ux * vy - uy * vx;
      const gx = Math.abs(determinant) > .000001 ? (du * vy - dv * uy) / determinant : 0;
      const gy = Math.abs(determinant) > .000001 ? (dv * ux - du * vx) / determinant : 0;
      const magnitude = gx * gx + gy * gy;
      const corners = [face.a, face.b, face.c, face.d];
      let darkest = face.a, brightest = face.a, low = Infinity, high = -Infinity;
      for (const vertex of corners) {
        const level = projected[vertex * 2] * gx + projected[vertex * 2 + 1] * gy;
        if (level < low) { low = level; darkest = vertex; }
        if (level > high) { high = level; brightest = vertex; }
      }
      if (magnitude > .00001 && high - low > .6) {
        // A gradient inside each patch removes the flat-shaded tessellation.
        const gradient = ctx.createLinearGradient(
          gx * low / magnitude * scale + offsetX,
          gy * low / magnitude * scale + offsetY,
          gx * high / magnitude * scale + offsetX,
          gy * high / magnitude * scale + offsetY,
        );
        gradient.addColorStop(0, colorAt(darkest));
        gradient.addColorStop(1, colorAt(brightest));
        ctx.fillStyle = gradient;
      } else {
        const red = (colors[face.a * 3] + colors[face.b * 3] + colors[face.c * 3] + colors[face.d * 3]) * .25;
        const green = (colors[face.a * 3 + 1] + colors[face.b * 3 + 1] + colors[face.c * 3 + 1] + colors[face.d * 3 + 1]) * .25;
        const blue = (colors[face.a * 3 + 2] + colors[face.b * 3 + 2] + colors[face.c * 3 + 2] + colors[face.d * 3 + 2]) * .25;
        ctx.fillStyle = `rgb(${Math.round(red)},${Math.round(green)},${Math.round(blue)})`;
      }
      ctx.strokeStyle = ctx.fillStyle;
      ctx.beginPath();
      corners.forEach((index, corner) => {
        const x = projected[index * 2] * scale + offsetX;
        const y = projected[index * 2 + 1] * scale + offsetY;
        if (corner === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(96, 36, 63, .17)";
    ctx.lineWidth = .75;
    ctx.beginPath();
    ctx.moveTo(width * .19, height * .9);
    ctx.lineTo(width * .24, height * .9);
    ctx.moveTo(width * .76, height * .9);
    ctx.lineTo(width * .81, height * .9);
    ctx.stroke();
  }

  function available() {
    return !disposed && inView && !document.hidden && width > 0 && height > 0;
  }

  function tick(now: number) {
    frame = 0;
    if (!available()) return;
    if (reduced) {
      viewX = 0;
      viewY = 0;
    } else {
      viewX += (pointerX - viewX) * .16;
      viewY += (pointerY - viewY) * .16;
      if (Math.abs(pointerX - viewX) < .0005) viewX = pointerX;
      if (Math.abs(pointerY - viewY) < .0005) viewY = pointerY;
    }
    draw(now);
    if (!reduced && (!entered || morphing || viewX !== pointerX || viewY !== pointerY)) frame = requestAnimationFrame(tick);
  }

  function schedule() {
    if (available() && !frame) frame = requestAnimationFrame(tick);
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function resize() {
    const bounds = stage.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    schedule();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  const intersection = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) {
      if (!entered) start = performance.now();
      schedule();
    } else stop();
  }, { threshold: 0 });
  intersection.observe(stage);
  function visibility() {
    if (document.hidden) stop(); else schedule();
  }
  function preference() {
    reduced = reduceQuery.matches;
    if (reduced) {
      pointerX = 0;
      pointerY = 0;
      entered = true;
    }
    schedule();
  }
  document.addEventListener("visibilitychange", visibility);
  reduceQuery.addEventListener("change", preference);
  resize();

  return {
    select(mode) {
      sample(performance.now());
      source.set(current);
      target = surfaces[mode];
      morphStart = performance.now();
      morphing = true;
      schedule();
    },
    point(x, y) {
      if (reduced || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      pointerX = x * .27;
      pointerY = y * .18;
      schedule();
    },
    dispose() {
      disposed = true;
      stop();
      observer.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      reduceQuery.removeEventListener("change", preference);
    },
  };
}

export function SignatureField() {
  const [selected, setSelected] = useState<Mode>("think");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLButtonElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const descriptionId = useId();
  const mode = modes.find((item) => item.id === selected)!;

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const engine = mountField(canvas, stage);
    engineRef.current = engine;
    return () => {
      engineRef.current = null;
      engine.dispose();
    };
  }, []);

  function select(next: Mode) {
    if (next === selected) return;
    setSelected(next);
    engineRef.current?.select(next);
  }

  return (
    <figure className="signature-field" data-mode={selected}>
      <button
        className="signature-field__stage"
        ref={stageRef}
        type="button"
        aria-label={`Change sculpture form, currently ${mode.label}`}
        aria-describedby={descriptionId}
        onClick={() => select(modes[(modes.findIndex((item) => item.id === selected) + 1) % modes.length].id)}
        onPointerMove={(event) => {
          if (event.pointerType !== "mouse") return;
          const box = event.currentTarget.getBoundingClientRect();
          engineRef.current?.point((event.clientX - box.left) / box.width - .5, (event.clientY - box.top) / box.height - .5);
        }}
        onPointerLeave={() => engineRef.current?.point(0, 0)}
        onBlur={() => engineRef.current?.point(0, 0)}
      >
        <canvas ref={canvasRef} width={600} height={440} aria-hidden="true" />
        <span className="signature-field__hint" aria-hidden="true">Click to reshape</span>
      </button>
      <figcaption className="signature-field__caption">
        <div className="signature-field__modes" role="group" aria-label="Ways I work">
          {modes.map((item) => (
            <button key={item.id} type="button" aria-pressed={selected === item.id} onClick={() => select(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <p className="signature-field__description" id={descriptionId} aria-live="polite" aria-atomic="true">{mode.description}</p>
      </figcaption>
    </figure>
  );
}
