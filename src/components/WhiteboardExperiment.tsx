import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type RefObject } from "react";
import { CHECK_POINTS, DEFAULT_POINTS, fitCurve, predictCurve, rootMeanSquaredError, updatePoint, type ModelDegree } from "../lib/whiteboard-model";
import "./whiteboard-experiment.css";

type WhiteboardProps = {
  open: boolean;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  id: string;
};

const models: { degree: ModelDegree; name: string; detail: string }[] = [
  { degree: 1, name: "Straight line", detail: "One slope" },
  { degree: 3, name: "Gentle curve", detail: "A little flexibility" },
  { degree: 6, name: "Flexible curve", detail: "Room for every point" },
];
const plot = { width: 640, height: 400, left: 52, right: 614, top: 28, bottom: 348 };
const xPosition = (x: number) => plot.left + x * (plot.right - plot.left);
const yPosition = (y: number) => plot.bottom - y * (plot.bottom - plot.top);
const number = new Intl.NumberFormat("en", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

export function WhiteboardExperiment({ open, onClose, returnFocusRef, id }: WhiteboardProps) {
  const [points, setPoints] = useState(() => DEFAULT_POINTS.map(point => ({ ...point })));
  const [degree, setDegree] = useState<ModelDegree>(3);
  const [selectedPoint, setSelectedPoint] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ index: number; pointer: number } | null>(null);
  const wasOpenRef = useRef(false);
  const titleId = useId();
  const helpId = useId();
  const clipId = useId();
  const selectId = useId();
  const rangeId = useId();
  const coefficients = useMemo(() => fitCurve(points, degree), [points, degree]);
  const fitError = rootMeanSquaredError(points, coefficients);
  const checkError = rootMeanSquaredError(CHECK_POINTS, coefficients);
  const curve = useMemo(() => Array.from({ length: 161 }, (_, index) => {
    const x = index / 160;
    // The clip only affects drawing. Error values use the actual predictions.
    return `${index ? "L" : "M"}${xPosition(x).toFixed(2)},${yPosition(predictCurve(coefficients, x)).toFixed(2)}`;
  }).join(" "), [coefficients]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      dialog.scrollTop = 0;
      document.body.classList.add("whiteboard-lab-open");
      closeRef.current?.focus({ preventScroll: true });
    } else {
      if (dialog.open) dialog.close();
      document.body.classList.remove("whiteboard-lab-open");
      dragRef.current = null;
      if (wasOpenRef.current && returnFocusRef.current?.isConnected) returnFocusRef.current.focus({ preventScroll: true });
    }
    wasOpenRef.current = open;
  }, [open, returnFocusRef]);

  useEffect(() => {
    const dialog = dialogRef.current;
    return () => {
      if (dialog?.open) dialog.close();
      document.body.classList.remove("whiteboard-lab-open");
      dragRef.current = null;
      if (wasOpenRef.current && returnFocusRef.current?.isConnected) returnFocusRef.current.focus({ preventScroll: true });
      wasOpenRef.current = false;
    };
  }, [returnFocusRef]);

  function setHeight(index: number, y: number) {
    setPoints(current => updatePoint(current, index, y));
  }

  function startDrag(index: number, event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || event.isPrimary === false) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    setSelectedPoint(index);
    dragRef.current = { index, pointer: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function movePoint(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    const surface = plotRef.current;
    if (!drag || drag.pointer !== event.pointerId || !surface) return;
    const bounds = surface.getBoundingClientRect();
    if (bounds.height <= 0) return;
    const svgY = (event.clientY - bounds.top) / bounds.height * plot.height;
    setHeight(drag.index, (plot.bottom - svgY) / (plot.bottom - plot.top));
  }

  function stopDrag(event: PointerEvent<HTMLButtonElement>) {
    if (dragRef.current?.pointer !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function moveByKeyboard(index: number, event: KeyboardEvent<HTMLButtonElement>) {
    const step = event.shiftKey ? .1 : .02;
    const current = points[index].y;
    const next = event.key === "ArrowUp" ? current + step : event.key === "ArrowDown" ? current - step : event.key === "Home" ? .95 : event.key === "End" ? .05 : null;
    if (next === null) return;
    event.preventDefault();
    setSelectedPoint(index);
    setHeight(index, next);
  }

  function reset() {
    dragRef.current = null;
    setPoints(DEFAULT_POINTS.map(point => ({ ...point })));
    setDegree(3);
    setSelectedPoint(0);
    setRevealed(false);
  }

  function keepFocusInside(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) return;
    const controls = event.currentTarget.querySelectorAll<HTMLElement>("button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),summary");
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && event.target === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && event.target === last) { event.preventDefault(); first?.focus(); }
  }

  function dismissBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
  }

  const insight = !revealed
    ? "Fit error only describes the orange points. Reveal points the curve hasn’t seen to look beyond the fit."
    : checkError > fitError * 1.5 + .01
      ? "A close fit is not the whole story. This curve misses the unseen points by more than the points it was fitted to."
      : "The unseen error is not much larger than the fit error. Compare all three curves—similar errors do not necessarily mean a good fit.";

  return <dialog className="whiteboard-lab" id={id} ref={dialogRef} aria-labelledby={titleId} aria-describedby={helpId} onCancel={event => { event.preventDefault(); onClose(); }} onClose={() => { if (open && !dialogRef.current?.open) onClose(); }} onKeyDown={keepFocusInside} onClick={dismissBackdrop}>
    <div className="whiteboard-lab__chrome"><p>A note from my whiteboard</p><button className="whiteboard-lab__close" type="button" ref={closeRef} aria-label="Close whiteboard experiment" onClick={onClose}><span aria-hidden="true">×</span>Close experiment</button></div>
    <div className="whiteboard-lab__content">
      <header className="whiteboard-lab__intro"><h2 id={titleId}>How much curve is enough?</h2><p id={helpId}>Move an orange point. Change the curve. Then see how it handles points it hasn’t seen.</p></header>
      <div className="whiteboard-lab__workspace">
        <div className="whiteboard-lab__board">
          <div className="whiteboard-lab__plot-wrap" ref={plotRef}>
            <svg className="whiteboard-lab__plot" viewBox="0 0 640 400" aria-hidden="true" focusable="false">
              <defs><clipPath id={clipId}><rect x={plot.left} y={plot.top} width={plot.right - plot.left} height={plot.bottom - plot.top} /></clipPath></defs>
              <g className="whiteboard-lab__grid">{[0, .25, .5, .75, 1].map(value => <g key={value}><line x1={plot.left} x2={plot.right} y1={yPosition(value)} y2={yPosition(value)} /><line x1={xPosition(value)} x2={xPosition(value)} y1={plot.top} y2={plot.bottom} /></g>)}</g>
              <g className="whiteboard-lab__axis-label"><text x="24" y="36">100</text><text x="34" y="353">0</text><text x="332" y="385" textAnchor="middle">Input</text></g>
              <g clipPath={`url(#${clipId})`}><path className="whiteboard-lab__curve" d={curve} fill="none" />{revealed && CHECK_POINTS.map((point, index) => <circle className="whiteboard-lab__check-dot" key={index} cx={xPosition(point.x)} cy={yPosition(point.y)} r="7" />)}</g>
            </svg>
            <div className="whiteboard-lab__points" role="group" aria-label="Training points">
              {points.map((point, index) => <button className="whiteboard-lab__point" type="button" key={index} aria-label={`Adjust point ${index + 1}`} aria-pressed={selectedPoint === index} title={`Point ${index + 1}: height ${Math.round(point.y * 100)}`} style={{ left: `${xPosition(point.x) / plot.width * 100}%`, top: `${yPosition(point.y) / plot.height * 100}%` }} onClick={() => setSelectedPoint(index)} onKeyDown={event => moveByKeyboard(index, event)} onPointerDown={event => startDrag(index, event)} onPointerMove={movePoint} onPointerUp={stopDrag} onPointerCancel={stopDrag} onLostPointerCapture={() => { dragRef.current = null; }}><span className="whiteboard-lab__point-dot" aria-hidden="true" /></button>)}
            </div>
          </div>
          <div className="whiteboard-lab__legend"><span><i className="legend-fit" aria-hidden="true" />Used to fit</span><span><i className="legend-curve" aria-hidden="true" />Fitted curve</span>{revealed && <span><i className="legend-check" aria-hidden="true" />Unseen checks</span>}</div>
          <p className="whiteboard-lab__plot-help">Drag points up or down, or select one and use the height slider. With a point focused, use ↑ / ↓.</p>
        </div>
        <div className="whiteboard-lab__controls">
          <fieldset className="whiteboard-lab__models"><legend>Curve flexibility</legend><div className="whiteboard-lab__model-options">{models.map(model => <button className="whiteboard-lab__model" key={model.degree} type="button" aria-label={model.name} aria-pressed={degree === model.degree} onClick={() => setDegree(model.degree)}><span>{model.name}</span><small>{model.detail}</small></button>)}</div></fieldset>
          <div className="whiteboard-lab__editor"><label htmlFor={selectId}>Selected point</label><select className="whiteboard-lab__point-select" id={selectId} name="whiteboard-point" value={selectedPoint} onChange={event => setSelectedPoint(Number(event.currentTarget.value))}>{points.map((_, index) => <option key={index} value={index}>Point {index + 1}</option>)}</select><label htmlFor={rangeId}>Point height<output htmlFor={rangeId}>{Math.round(points[selectedPoint].y * 100)}</output></label><input type="range" id={rangeId} name="whiteboard-height" min="5" max="95" step="1" value={Math.round(points[selectedPoint].y * 100)} onChange={event => setHeight(selectedPoint, Number(event.currentTarget.value) / 100)} /></div>
          <button className="whiteboard-lab__reveal" type="button" aria-pressed={revealed} onClick={() => setRevealed(current => !current)}>{revealed ? "Hide unseen points" : "Show unseen points"}<span aria-hidden="true">{revealed ? "−" : "+"}</span></button>
          <dl className="whiteboard-lab__errors" aria-label="Root mean squared error on a zero to one hundred scale"><div><dt>Fit error</dt><dd>{number.format(fitError * 100)}</dd></div><div><dt>Unseen error</dt><dd>{revealed ? number.format(checkError * 100) : <span className="whiteboard-lab__unrevealed">Not revealed</span>}</dd></div></dl>
          <p className="whiteboard-lab__insight" role="status">{insight}</p>
        </div>
      </div>
      <footer className="whiteboard-lab__footer"><p className="whiteboard-lab__disclaimer">Simulated data, fitted locally with polynomial least squares. Error is RMSE on a 0–100 scale; unseen points never enter the fit. Your edits stay in this tab.</p><div className="whiteboard-lab__actions"><button className="whiteboard-lab__reset" type="button" onClick={reset}>Reset experiment</button><a href="/#education-title">My mathematical background<span aria-hidden="true">↗</span></a></div></footer>
    </div>
  </dialog>;
}
