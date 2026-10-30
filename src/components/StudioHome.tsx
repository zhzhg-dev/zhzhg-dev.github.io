import { useId, useRef, useState, type PointerEvent } from "react";
import "./studio-home.css";

type StudioSpot = "build" | "think" | "home";

const spots: { id: StudioSpot; label: string; title: string; description: string; href: string; link: string }[] = [
  { id: "build", label: "At the screen", title: "From an idea to something useful.", description: "I build research tools, systems experiments, and forecasting projects. AI is most interesting to me when I can put it to the test.", href: "/projects/", link: "Explore my projects" },
  { id: "think", label: "On the board", title: "A little mathematical curiosity.", description: "My background is in Information and Computational Science. I like understanding the assumptions behind a model, not just the answer it gives.", href: "/#education-title", link: "My background" },
  { id: "home", label: "Out the window", title: "Auckland, New Zealand.", description: "I’m a Master of Information Technology student and Graduate Teaching Assistant at the University of Auckland, exploring AI, simulation, and game AI.", href: "/#studio-about", link: "A little more about me" },
];

export function StudioHome() {
  const titleId = useId();
  const noteId = useId();
  const [selected, setSelected] = useState<StudioSpot | null>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const selectedButtonRef = useRef<HTMLButtonElement | null>(null);
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

  return <div className="studio-home">
    <section className="studio-hero" id="top" aria-labelledby={titleId} onKeyDown={event => { if (event.key === "Escape" && selected) { event.preventDefault(); closeNote(); } }}>
      <div className="studio-intro">
        <h1 id={titleId} translate="no" aria-label="Grant Zhang">Grant<br />{" "}Zhang<span className="studio-name-stop">.</span></h1>
        <p className="studio-role">AI product builder</p>
        <p className="studio-intro__copy">A mathematical mind.<br />{" "}A curiosity for what’s possible.</p>
      </div>

      <div className="studio-scene" onPointerMove={moveScene} onPointerLeave={resetScene}>
        <div className="studio-scene__movement" ref={artRef}>
          <picture className="studio-scene__picture">
            <source type="image/webp" srcSet="/studio/grant-daylight-studio-480.webp 480w, /studio/grant-daylight-studio-768.webp 768w, /studio/grant-daylight-studio-1200.webp 1200w, /studio/grant-daylight-studio-1448.webp 1448w" sizes="(max-width: 760px) 100vw, (max-width: 1050px) 84vw, (min-width: 1908px) 1450px, 76vw" />
            <img className="studio-scene__art" src="/studio/grant-daylight-studio-v1.png" width="1448" height="1086" fetchPriority="high" decoding="async" alt="An illustrated AI workspace: a developer at a curved desk, a wide screen and mathematical idea board, with Auckland’s skyline through an arched window." />
          </picture>
          <div className="studio-hotspots" role="group" aria-label="Explore my illustrated workspace">
            {spots.map(item => <button key={item.id} className={`studio-hotspot studio-hotspot--${item.id}`} type="button" aria-label={item.label} aria-pressed={selected === item.id} aria-expanded={selected === item.id} aria-controls={noteId} onClick={event => { selectedButtonRef.current = event.currentTarget; setSelected(current => current === item.id ? null : item.id); }}>
              <span className="studio-hotspot__dot" aria-hidden="true">+</span><span className="studio-hotspot__label">{item.label}</span>
            </button>)}
          </div>
        </div>
      </div>

      <aside className="studio-note" id={noteId} aria-label="Workspace detail" aria-live="polite" hidden={!spot}>
        {spot && <><button className="studio-note__close" type="button" aria-label="Close workspace detail" onClick={closeNote}>×</button><h2>{spot.title}</h2><p>{spot.description}</p><a href={spot.href}>{spot.link}<span aria-hidden="true">↗</span></a></>}
      </aside>

      <p className="studio-location">Based in Auckland,<br />New Zealand.</p>
      <p className="studio-touch-hint">Tap the + marks to look around.</p>
      <a className="studio-scroll" href="#studio-about" aria-label="A little more about Grant"><span className="studio-scroll__mouse" aria-hidden="true"><span /></span><span>A little more about me</span></a>
    </section>

    <section className="studio-about" id="studio-about" aria-labelledby="studio-about-title">
      <div className="studio-about__title"><p>Behind the screen</p><h2 id="studio-about-title">From models<br />to useful things.</h2></div>
      <div className="studio-about__copy"><p>I’m Grant, a Master of Information Technology student and Graduate Teaching Assistant at the University of Auckland.</p><p>My background is in mathematics and computational science. I like the moment when a model leaves the notebook and becomes something a person can question, use, and improve.</p><p>AI product experiences, game AI, simulation, and model evaluation are where I explore that connection. Teaching keeps the other half of the question close: can someone else understand what I built?</p></div>
    </section>

    <section className="studio-story" aria-label="How I think and work">
      <article><h3>Start with the assumptions.</h3><p>My undergraduate work explored rumour propagation through heterogeneous cellular automata. It left me interested in how a small set of rules can shape a larger system—and what those rules leave out.</p></article>
      <article><h3>Build something people can inspect.</h3><p>In Folio, that means keeping the original evidence close to a conclusion. In ExplainLab, it means replaying two strategies on the same workload. I want the reasoning to remain visible, not disappear behind an answer.</p><a href="/projects/">See those ideas in practice<span aria-hidden="true">↗</span></a></article>
      <article><h3>Explain it clearly.</h3><p>Supporting COMPSCI 111 labs and Open Lab sessions means working through problems with people who are new to computing. It is a useful reminder to ask a better question, slow down, and make the next step clear.</p></article>
    </section>

    <section className="studio-now" aria-labelledby="studio-now-title">
      <div className="studio-now__intro"><p>On my desk</p><h2 id="studio-now-title">Questions I’m exploring.</h2></div>
      <div className="studio-now__items"><article><h3>AI tools people can inspect</h3><p>Research workflows, local AI, and keeping evidence attached as ideas turn into writing.</p><a href="/projects/#folio">Folio<span aria-hidden="true">↗</span></a></article><article><h3>Game AI & simulation</h3><p>Learning from demonstrations, testing model assumptions, and making system behaviour easier to understand.</p><a href="/projects/#learn-to-race">Learn-to-Race<span aria-hidden="true">↗</span></a></article></div>
    </section>

    <nav className="studio-next" aria-label="Explore my background and work"><a href="#work-title"><span>My background</span><p>Teaching, education, and the things I’m learning.</p><span className="studio-next__arrow" aria-hidden="true">↗</span></a><a href="/projects/"><span>Things I’ve made</span><p>Ideas turned into tools and experiments.</p><span className="studio-next__arrow" aria-hidden="true">↗</span></a></nav>
  </div>;
}
