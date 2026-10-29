import { useEffect, useId, useRef, useState } from "react";
import "./signature-field.css";

type Mode = "think" | "build" | "explain";
type Point = [number, number];
type Engine = { select: (mode: Mode) => void; point: (x: number, y: number) => void; dispose: () => void };

const modes: { id: Mode; label: string; description: string }[] = [
  { id: "think", label: "Think", description: "Mathematics taught me to look for the structure inside a question." },
  { id: "build", label: "Build", description: "I turn that structure into AI products people can actually use." },
  { id: "explain", label: "Explain", description: "Teaching reminds me that a good idea should make sense to someone else." },
];
const lineCount = 48;
const mix = (a: number, b: number, amount: number) => a + (b - a) * amount;

// A planar interference drawing. Analytic tangents keep every cubic smooth;
// all modes share the same topology and contain no camera or lighting model.
function buildSignaturePaths(mode: number, pointer: Point = [0, 0]) {
  const segment = Math.max(0, Math.min(2, mode));
  const twist = segment <= 1 ? mix(.85, 0, segment) : mix(0, .28, segment - 1);
  const corner = segment <= 1 ? mix(.17, .22, segment) : mix(.22, .055, segment - 1);
  const aspect = segment <= 1 ? 1 : mix(1, .82, segment - 1);
  const paths: string[] = [];
  for (let i = 0; i < lineCount; i++) {
    const t = i / (lineCount - 1);
    const radius = 30 + t * 148;
    const rotation = -.35 + twist * (1 - t) ** 1.4;
    const cr = Math.cos(rotation), sr = Math.sin(rotation);
    const point = (angle: number, tangent = false): Point => {
      const x = radius * (tangent ? -Math.sin(angle) - 3 * corner * Math.sin(3 * angle) : Math.cos(angle) + corner * Math.cos(3 * angle));
      const y = radius * aspect * (tangent ? Math.cos(angle) - 3 * corner * Math.cos(3 * angle) : Math.sin(angle) - corner * Math.sin(3 * angle));
      return [x * cr - y * sr + (tangent ? 0 : 310), x * sr + y * cr + (tangent ? 0 : 250)];
    };
    const warp = ([x, y]: Point): Point => {
      const dx = x - (310 + pointer[0] * 620);
      const dy = y - (250 + pointer[1] * 520);
      const influence = Math.exp(-(dx * dx + dy * dy) / 18000);
      return [x + influence * pointer[0] * 46, y + influence * pointer[1] * 40];
    };
    const coordinates = (p: Point) => warp(p).map(value => value.toFixed(2)).join(" ");
    const step = Math.PI * 2 / 16;
    let path = `M${coordinates(point(0))}`;
    for (let part = 0; part < 16; part++) {
      const angle = part * step, next = (part + 1) * step;
      const a = point(angle), b = point(next);
      const da = point(angle, true), db = point(next, true);
      path += ` C${coordinates([a[0] + da[0] * step / 3, a[1] + da[1] * step / 3])} ${coordinates([b[0] - db[0] * step / 3, b[1] - db[1] * step / 3])} ${coordinates(b)}`;
    }
    paths.push(`${path} Z`);
  }
  return paths;
}

function mountSignature(svg: SVGSVGElement, stage: HTMLElement): Engine {
  const lines = svg.querySelectorAll<SVGPathElement>("[data-signature-line]");
  let disposed = false, inView = true, frame = 0;
  let currentMode = 0, sourceMode = 0, targetMode = 0, changedAt = 0;
  let x = 0, y = 0, targetX = 0, targetY = 0;
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = preference.matches;
  const available = () => !disposed && inView && !document.hidden;
  function draw(now: number) {
    frame = 0;
    if (!available()) return;
    const progress = reduced || sourceMode === targetMode ? 1 : Math.min(1, Math.max(0, (now - changedAt) / 620));
    currentMode = mix(sourceMode, targetMode, 1 - (1 - progress) ** 3);
    if (progress === 1) sourceMode = targetMode;
    x = reduced ? 0 : mix(x, targetX, .2);
    y = reduced ? 0 : mix(y, targetY, .2);
    if (Math.abs(x - targetX) < .0002) x = targetX;
    if (Math.abs(y - targetY) < .0002) y = targetY;
    const paths = buildSignaturePaths(currentMode, [x, y]);
    lines.forEach((line, index) => line.setAttribute("d", paths[index]));
    if (!reduced && (progress < 1 || x !== targetX || y !== targetY)) schedule();
  }
  function schedule() { if (available() && !frame) frame = requestAnimationFrame(draw); }
  function stop() { cancelAnimationFrame(frame); frame = 0; }
  function visibility() { if (document.hidden) stop(); else schedule(); }
  function motionPreference() {
    reduced = preference.matches;
    if (reduced) { x = 0; y = 0; targetX = 0; targetY = 0; }
    schedule();
  }
  const observer = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) schedule(); else stop();
  });
  observer.observe(stage);
  document.addEventListener("visibilitychange", visibility);
  preference.addEventListener("change", motionPreference);
  draw(performance.now());
  return {
    select(mode) {
      sourceMode = currentMode;
      targetMode = modes.findIndex(item => item.id === mode);
      changedAt = performance.now();
      schedule();
    },
    point(px, py) {
      if (reduced || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      targetX = Math.max(-.5, Math.min(.5, px));
      targetY = Math.max(-.5, Math.min(.5, py));
      schedule();
    },
    dispose() {
      disposed = true;
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      preference.removeEventListener("change", motionPreference);
    },
  };
}

const initialPaths = buildSignaturePaths(0);

export function SignatureField() {
  const [selected, setSelected] = useState<Mode>("think");
  const svgRef = useRef<SVGSVGElement>(null);
  const stageRef = useRef<HTMLButtonElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const descriptionId = useId();
  const active = modes.find(item => item.id === selected)!;
  useEffect(() => {
    if (!svgRef.current || !stageRef.current) return;
    const engine = mountSignature(svgRef.current, stageRef.current);
    engineRef.current = engine;
    return () => { engine.dispose(); engineRef.current = null; };
  }, []);
  function select(mode: Mode) {
    if (mode === selected) return;
    setSelected(mode);
    engineRef.current?.select(mode);
  }
  return <figure className="signature-field" data-mode={selected}>
    <button className="signature-field__stage" type="button" ref={stageRef}
      aria-label={`Change signature, currently ${active.label}`} aria-describedby={descriptionId}
      onClick={() => select(modes[(modes.findIndex(item => item.id === selected) + 1) % modes.length].id)}
      onPointerMove={event => {
        if (event.pointerType !== "mouse") return;
        const box = event.currentTarget.getBoundingClientRect();
        engineRef.current?.point((event.clientX - box.left) / box.width - .5, (event.clientY - box.top) / box.height - .5);
      }} onPointerLeave={() => engineRef.current?.point(0, 0)} onBlur={() => engineRef.current?.point(0, 0)}>
      <svg className="signature-field__drawing" viewBox="0 0 620 520" ref={svgRef} fill="none" aria-hidden="true">
        {initialPaths.map((path, index) => <path key={index} data-signature-line d={path} className="signature-field__line" vectorEffect="non-scaling-stroke" />)}
      </svg>
      <span className="signature-field__hint" aria-hidden="true"><span className="signature-field__mouse-hint">Move to explore. Click to change.</span><span className="signature-field__touch-hint">Tap the signature to change.</span></span>
    </button>
    <figcaption className="signature-field__caption">
      <div className="signature-field__modes" role="group" aria-label="Ways I work">{modes.map(mode => <button key={mode.id} type="button" aria-pressed={selected === mode.id} onClick={() => select(mode.id)}>{mode.label}</button>)}</div>
      <p className="signature-field__description" id={descriptionId} aria-live="polite" aria-atomic="true">{active.description}</p>
    </figcaption>
  </figure>;
}
