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
          <img className="studio-scene__art" src="/studio/grant-daylight-studio-v1.png" width="1448" height="1086" fetchPriority="high" decoding="async" alt="An illustrated AI workspace: a developer at a curved desk, a wide screen and mathematical idea board, with Auckland’s skyline through an arched window." />
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
      <a className="studio-scroll" href="#studio-about" aria-label="A little more about Grant"><span className="studio-scroll__mouse" aria-hidden="true"><span /></span><span>A little more about me</span></a>
    </section>

    <section className="studio-about" id="studio-about" aria-labelledby="studio-about-title">
      <div className="studio-about__title"><p>Behind the screen</p><h2 id="studio-about-title">Curious by nature.<br />Practical by choice.</h2></div>
      <div className="studio-about__copy"><p>I’m Grant, a Master of Information Technology student and Graduate Teaching Assistant at the University of Auckland.</p><p>Mathematics taught me to ask why. Building software lets me find out what happens next. These days, that means exploring AI product experiences, game AI, simulation, and model evaluation—and helping students work through their first computing problems.</p><p>I’m interested in tools that make something difficult a little clearer. There’s usually a prototype, a notebook, and a few good questions involved.</p></div>
    </section>

    <nav className="studio-next" aria-label="Explore my background and work"><a href="#work-title"><span>My background</span><p>Teaching, education, and the things I’m learning.</p><span className="studio-next__arrow" aria-hidden="true">↗</span></a><a href="/projects/"><span>Things I’ve made</span><p>Ideas turned into tools and experiments.</p><span className="studio-next__arrow" aria-hidden="true">↗</span></a></nav>
  </div>;
}
