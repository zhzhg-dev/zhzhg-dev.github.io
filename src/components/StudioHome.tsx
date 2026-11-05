import { useId, useRef, useState, type PointerEvent } from "react";
import { AucklandClock } from "./AucklandClock";
import { WhiteboardExperiment } from "./WhiteboardExperiment";
import { StudioAbout } from "./StudioAbout";
import { useLanguage } from "../i18n";
import "./studio-home.css";

type StudioSpot = "build" | "think" | "home";

export function StudioHome() {
  const { t, href } = useLanguage();
  const spots: { id: StudioSpot; label: string; title: string; description: string; href: string; link: string }[] = [
    { id: "build", label: t("At the screen", "屏幕里的项目"), title: t("From an idea to something useful.", "让想法成为能用的东西。"), description: t("I build research tools, systems experiments, and forecasting projects. AI is most interesting to me when I can put it to the test.", "我做研究工具、系统实验和预测项目。对我来说，AI 最有趣的地方，是把它放进真实的问题里，看看它到底能做到什么。"), href: "/projects/", link: t("Explore my projects", "看看我的项目") },
    { id: "think", label: t("On the board", "白板上的想法"), title: t("A little mathematical curiosity.", "一点数学上的好奇心。"), description: t("My background is in Information and Computational Science. I like understanding the assumptions behind a model, not just the answer it gives.", "我的本科专业是信息与计算科学。我喜欢弄清楚模型背后的假设，而不只是拿到一个答案。"), href: "/#education-title", link: t("My background", "我的学习背景") },
    { id: "home", label: t("Auckland time", "奥克兰时钟"), title: t("Auckland, New Zealand.", "新西兰，奥克兰。"), description: t("This is where I study, teach, and build.", "这里是我学习、教学和做项目的地方。"), href: "/#studio-about", link: t("A little more about me", "再了解我一点") },
  ];
  const titleId = useId();
  const noteId = useId();
  const whiteboardId = useId();
  const [selected, setSelected] = useState<StudioSpot | null>(null);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);
  const [goldenHour, setGoldenHour] = useState(false);
  const artRef = useRef<HTMLDivElement>(null);
  const selectedButtonRef = useRef<HTMLButtonElement | null>(null);
  const whiteboardTriggerRef = useRef<HTMLButtonElement | null>(null);
  const spot = spots.find(item => item.id === selected);

  function moveScene(event: PointerEvent<HTMLDivElement>) {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
    const y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
    artRef.current?.style.setProperty("--scene-x", `${x * 6}px`);
    artRef.current?.style.setProperty("--scene-y", `${y * 4}px`);
  }

  function resetScene() {
    artRef.current?.style.setProperty("--scene-x", "0px");
    artRef.current?.style.setProperty("--scene-y", "0px");
  }

  function closeNote() {
    setSelected(null);
    selectedButtonRef.current?.focus();
  }

  function openWhiteboard(trigger: HTMLButtonElement) {
    whiteboardTriggerRef.current = trigger;
    setSelected(null);
    resetScene();
    setWhiteboardOpen(true);
  }

  return <div className="studio-home">
    <section className={`studio-hero${goldenHour ? " studio-hero--golden" : ""}`} id="top" aria-labelledby={titleId} onKeyDown={event => { if (event.key === "Escape" && selected) { event.preventDefault(); closeNote(); } }}>
      <div className="studio-intro">
        <p className="studio-welcome">{t("Hi, make yourself at home.", "嗨，欢迎来我的小工作室。")}</p>
        <h1 id={titleId} translate="no" lang="en" aria-label="Grant">Grant<span className="studio-name-stop">.</span></h1>
        <p className="studio-role">{t("AI product builder", "AI 产品构建者")}</p>
        <p className="studio-intro__copy">{t("A mathematical mind.", "用数学理解问题，")}<br />{" "}{t("A curiosity for what’s possible.", "用好奇心探索可能。")}</p>
        <div className="studio-intro__actions">
          <button className="studio-intro__experiment" type="button" aria-haspopup="dialog" aria-expanded={whiteboardOpen} aria-controls={whiteboardId} onClick={event => openWhiteboard(event.currentTarget)}>
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M2.5 2.5v11h11M5 10c1.4 0 1.5-4 3.5-4 1.5 0 1.8 1.5 3 1.5 1 0 1.5-1.5 2-3"/></svg>
            {t("Try the whiteboard", "试试白板实验")}
          </button>
          <a className="studio-intro__link" href="#studio-about">{t("About me", "关于我")} <span aria-hidden="true">↓</span></a>
        </div>
      </div>

      <div className="studio-scene" onPointerMove={moveScene} onPointerLeave={resetScene}>
        <div className="studio-scene__movement" ref={artRef}>
          <picture className="studio-scene__picture">
            <source type="image/webp" srcSet="/studio/grant-cozy-studio-v2-480.webp 480w, /studio/grant-cozy-studio-v2-768.webp 768w, /studio/grant-cozy-studio-v2-1200.webp 1200w, /studio/grant-cozy-studio-v2-1448.webp 1448w" sizes="(max-width: 760px) 100vw, (max-width: 1050px) 65vw, (min-width: 1600px) 1050px, 68vw" />
            <img className="studio-scene__art" src="/studio/grant-cozy-studio-v2.png" width="1448" height="1086" fetchPriority="high" decoding="async" alt={t("An illustrated cozy studio: a developer in a sage jumper at a wooden desk, a screen and mathematical whiteboard, with Auckland’s skyline through an arched window.", "温暖的小工作室插画：穿鼠尾草绿毛衣的开发者坐在木桌前，旁边是屏幕和数学白板，拱形窗外是奥克兰的天际线。")} />
          </picture>
          <div className="studio-hotspots" role="group" aria-label={t("Explore my illustrated workspace", "逛逛我的插画工作室")}>
            {spots.map(item => <button key={item.id} className={`studio-hotspot studio-hotspot--${item.id}`} type="button" aria-label={item.id === "think" ? t("Try the whiteboard", "试试白板实验") : item.label} aria-haspopup={item.id === "think" ? "dialog" : undefined} aria-pressed={item.id === "think" ? whiteboardOpen : selected === item.id} aria-expanded={item.id === "think" ? whiteboardOpen : selected === item.id} aria-controls={item.id === "think" ? whiteboardId : noteId} onClick={event => { if (item.id === "think") { openWhiteboard(event.currentTarget); return; } selectedButtonRef.current = event.currentTarget; setSelected(current => current === item.id ? null : item.id); }}>
              <span className="studio-hotspot__dot" aria-hidden="true">{item.id === "home"
                ? <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" focusable="false"><circle cx="10" cy="10" r="7.25"/><path d="M10 6v4l2.7 1.7"/></svg>
                : "+"}</span><span className="studio-hotspot__label">{item.id === "think" ? t("Try the whiteboard", "试试白板实验") : item.label}</span>
            </button>)}
          </div>
        </div>
      </div>

      <aside className="studio-note" id={noteId} aria-label={t("Workspace detail", "工作室小记")} aria-live="polite" hidden={!spot}>
        {spot && <><button className="studio-note__close" type="button" aria-label={t("Close workspace detail", "关闭工作室小记")} onClick={closeNote}>×</button><h2>{spot.title}</h2>{spot.id === "home" && <AucklandClock />}<p>{spot.description}</p><a href={href(spot.href)}>{spot.link}<span aria-hidden="true">↗</span></a></>}
      </aside>

      <div className="studio-light-control" role="group" aria-label={t("Studio colours", "工作室光线")}><span aria-hidden="true">☀</span><button type="button" aria-pressed={!goldenHour} onClick={() => setGoldenHour(false)}>{t("Daylight", "日光")}</button><button type="button" aria-pressed={goldenHour} onClick={() => setGoldenHour(true)}>{t("Golden hour", "暖阳")}</button></div>

      <p className="studio-location"><span className="studio-location__dot" aria-hidden="true" /> {t("Auckland, New Zealand", "新西兰 · 奥克兰")}</p>
      <p className="studio-touch-hint">{t("Tap the screen, whiteboard, or clock.", "点点屏幕、白板或窗边时钟。")}</p>
      <a className="studio-scroll" href="#studio-about" aria-label={t("A little more about Grant", "再了解 Grant 一点")}><span className="studio-scroll__mouse" aria-hidden="true"><span /></span><span>{t("A little more about me", "再了解我一点")}</span></a>
    </section>

    <WhiteboardExperiment id={whiteboardId} open={whiteboardOpen} onClose={() => setWhiteboardOpen(false)} returnFocusRef={whiteboardTriggerRef} />

    <StudioAbout />
  </div>;
}
