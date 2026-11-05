import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type RefObject } from "react";
import { CHECK_POINTS, DEFAULT_POINTS, fitCurve, predictCurve, rootMeanSquaredError, updatePoint, type ModelDegree } from "../lib/whiteboard-model";
import { useLanguage } from "../i18n";
import { LanguageSwitch } from "./LanguageSwitch";
import "./whiteboard-experiment.css";

type WhiteboardProps = {
  open: boolean;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  id: string;
};

const models: { degree: ModelDegree; name: string; detail: string; nameZh: string; detailZh: string }[] = [
  { degree: 1, name: "Straight line", detail: "One slope", nameZh: "直线", detailZh: "一个斜率" },
  { degree: 3, name: "Gentle curve", detail: "A little flexibility", nameZh: "平缓曲线", detailZh: "留一点变化空间" },
  { degree: 6, name: "Flexible curve", detail: "Room for every point", nameZh: "灵活曲线", detailZh: "容纳每个数据点" },
];
const plot = { width: 640, height: 400, left: 52, right: 614, top: 28, bottom: 348 };
const xPosition = (x: number) => plot.left + x * (plot.right - plot.left);
const yPosition = (y: number) => plot.bottom - y * (plot.bottom - plot.top);
const number = new Intl.NumberFormat("en", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

export function WhiteboardExperiment({ open, onClose, returnFocusRef, id }: WhiteboardProps) {
  const { t, href } = useLanguage();
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
    ? t("Fit error only describes the orange points. Reveal points the curve hasn’t seen to look beyond the fit.", "拟合误差只描述橙色数据点。显示曲线没见过的数据点，看看拟合之外的表现。")
    : checkError > fitError * 1.5 + .01
      ? t("A close fit is not the whole story. This curve misses the unseen points by more than the points it was fitted to.", "贴合已知数据，并不代表学到了规律。这条曲线在未见数据上的误差，比拟合数据上的更大。")
      : t("The unseen error is not much larger than the fit error. Compare all three curves—similar errors do not necessarily mean a good fit.", "未见数据误差与拟合误差相差不大。试着比较三种曲线：误差相近，也不一定意味着拟合得好。");

  return <dialog className="whiteboard-lab" id={id} ref={dialogRef} aria-labelledby={titleId} aria-describedby={helpId} onCancel={event => { event.preventDefault(); onClose(); }} onClose={() => { if (open && !dialogRef.current?.open) onClose(); }} onKeyDown={keepFocusInside} onClick={dismissBackdrop}>
    <div className="whiteboard-lab__chrome"><p>{t("A note from my whiteboard", "白板上的一个小实验")}</p><div className="studio-dialog-actions"><LanguageSwitch /><button className="whiteboard-lab__close" type="button" ref={closeRef} aria-label={t("Close whiteboard experiment", "关闭白板实验")} onClick={onClose}><span aria-hidden="true">×</span>{t("Close experiment", "关闭实验")}</button></div></div>
    <div className="whiteboard-lab__content">
      <header className="whiteboard-lab__intro"><h2 id={titleId}>{t("How much curve is enough?", "曲线，越灵活越好吗？")}</h2><p id={helpId}>{t("Move an orange point. Change the curve. Then see how it handles points it hasn’t seen.", "移动橙色数据点，换一种曲线，再看看它如何应对没见过的数据。")}</p></header>
      <div className="whiteboard-lab__workspace">
        <div className="whiteboard-lab__board">
          <div className="whiteboard-lab__plot-wrap" ref={plotRef}>
            <svg className="whiteboard-lab__plot" viewBox="0 0 640 400" aria-hidden="true" focusable="false">
              <defs><clipPath id={clipId}><rect x={plot.left} y={plot.top} width={plot.right - plot.left} height={plot.bottom - plot.top} /></clipPath></defs>
              <g className="whiteboard-lab__grid">{[0, .25, .5, .75, 1].map(value => <g key={value}><line x1={plot.left} x2={plot.right} y1={yPosition(value)} y2={yPosition(value)} /><line x1={xPosition(value)} x2={xPosition(value)} y1={plot.top} y2={plot.bottom} /></g>)}</g>
              <g className="whiteboard-lab__axis-label"><text x="24" y="36">100</text><text x="34" y="353">0</text><text x="332" y="385" textAnchor="middle">{t("Input", "输入")}</text></g>
              <g clipPath={`url(#${clipId})`}><path className="whiteboard-lab__curve" d={curve} fill="none" />{revealed && CHECK_POINTS.map((point, index) => <circle className="whiteboard-lab__check-dot" key={index} cx={xPosition(point.x)} cy={yPosition(point.y)} r="7" />)}</g>
            </svg>
            <div className="whiteboard-lab__points" role="group" aria-label={t("Training points", "拟合数据点")}>
              {points.map((point, index) => <button className="whiteboard-lab__point" type="button" key={index} aria-label={t(`Adjust point ${index + 1}`, `调整第 ${index + 1} 个数据点`)} aria-pressed={selectedPoint === index} title={t(`Point ${index + 1}: height ${Math.round(point.y * 100)}`, `数据点 ${index + 1}：高度 ${Math.round(point.y * 100)}`)} style={{ left: `${xPosition(point.x) / plot.width * 100}%`, top: `${yPosition(point.y) / plot.height * 100}%` }} onClick={() => setSelectedPoint(index)} onKeyDown={event => moveByKeyboard(index, event)} onPointerDown={event => startDrag(index, event)} onPointerMove={movePoint} onPointerUp={stopDrag} onPointerCancel={stopDrag} onLostPointerCapture={() => { dragRef.current = null; }}><span className="whiteboard-lab__point-dot" aria-hidden="true" /></button>)}
            </div>
          </div>
          <div className="whiteboard-lab__legend"><span><i className="legend-fit" aria-hidden="true" />{t("Used to fit", "拟合数据")}</span><span><i className="legend-curve" aria-hidden="true" />{t("Fitted curve", "拟合曲线")}</span>{revealed && <span><i className="legend-check" aria-hidden="true" />{t("Unseen checks", "未见数据")}</span>}</div>
          <p className="whiteboard-lab__plot-help">{t("Drag points up or down, or select one and use the height slider. With a point focused, use ↑ / ↓.", "上下拖动数据点，或选中后使用高度滑块。聚焦数据点时，也可以按 ↑ / ↓ 调整。")}</p>
        </div>
        <div className="whiteboard-lab__controls">
          <fieldset className="whiteboard-lab__models"><legend>{t("Curve flexibility", "曲线灵活度")}</legend><div className="whiteboard-lab__model-options">{models.map(model => <button className="whiteboard-lab__model" key={model.degree} type="button" aria-label={t(model.name, model.nameZh)} aria-pressed={degree === model.degree} onClick={() => setDegree(model.degree)}><span>{t(model.name, model.nameZh)}</span><small>{t(model.detail, model.detailZh)}</small></button>)}</div></fieldset>
          <div className="whiteboard-lab__editor"><label htmlFor={selectId}>{t("Selected point", "选中的数据点")}</label><select className="whiteboard-lab__point-select" id={selectId} name="whiteboard-point" value={selectedPoint} onChange={event => setSelectedPoint(Number(event.currentTarget.value))}>{points.map((_, index) => <option key={index} value={index}>{t(`Point ${index + 1}`, `数据点 ${index + 1}`)}</option>)}</select><label htmlFor={rangeId}>{t("Point height", "数据点高度")}<output htmlFor={rangeId}>{Math.round(points[selectedPoint].y * 100)}</output></label><input type="range" id={rangeId} name="whiteboard-height" min="5" max="95" step="1" value={Math.round(points[selectedPoint].y * 100)} onChange={event => setHeight(selectedPoint, Number(event.currentTarget.value) / 100)} /></div>
          <button className="whiteboard-lab__reveal" type="button" aria-pressed={revealed} onClick={() => setRevealed(current => !current)}>{revealed ? t("Hide unseen points", "隐藏未见数据") : t("Show unseen points", "显示未见数据")}<span aria-hidden="true">{revealed ? "−" : "+"}</span></button>
          <dl className="whiteboard-lab__errors" aria-label={t("Root mean squared error on a zero to one hundred scale", "0 至 100 标度上的均方根误差")}><div><dt>{t("Fit error", "拟合误差")}</dt><dd>{number.format(fitError * 100)}</dd></div><div><dt>{t("Unseen error", "未见数据误差")}</dt><dd>{revealed ? number.format(checkError * 100) : <span className="whiteboard-lab__unrevealed">{t("Not revealed", "尚未显示")}</span>}</dd></div></dl>
          <p className="whiteboard-lab__insight" role="status">{insight}</p>
        </div>
      </div>
      <footer className="whiteboard-lab__footer"><p className="whiteboard-lab__disclaimer">{t("Simulated data, fitted locally with polynomial least squares. Error is RMSE on a 0–100 scale; unseen points never enter the fit. Your edits stay in this tab.", "使用模拟数据，在本地以多项式最小二乘法拟合。误差为 0–100 标度上的 RMSE；未见数据不参与拟合。你的调整仅保留在当前标签页。")}</p><div className="whiteboard-lab__actions"><button className="whiteboard-lab__reset" type="button" onClick={reset}>{t("Reset experiment", "重置实验")}</button><a href={href("/#education-title")}>{t("My mathematical background", "了解我的数学背景")}<span aria-hidden="true">↗</span></a></div></footer>
    </div>
  </dialog>;
}
