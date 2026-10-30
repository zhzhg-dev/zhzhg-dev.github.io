import "./studio-about.css";

export function StudioAbout() {
  return <div className="studio-about-display">
    <section className="studio-about" id="studio-about" aria-labelledby="studio-about-title">
      <div className="studio-about__intro">
        <p className="studio-about__label">Behind the screen</p>
        <h2 id="studio-about-title">From models<br />to useful things.</h2>
        <div className="studio-about__copy"><p>I’m Grant, a Master of Information Technology student and Graduate Teaching Assistant at the University of Auckland.</p><p>My background is in mathematics and computational science. Today, I explore AI products, simulation, and the practical work of turning an idea into something people can use and question.</p></div>
      </div>
      <div className="studio-about__still-life" aria-hidden="true"><img src="/studio/study-notebook-v1.webp" alt="" width="760" height="507" loading="lazy" decoding="async" /></div>
    </section>

    <section className="studio-now" aria-labelledby="studio-now-title">
      <div className="studio-now__intro"><p>On my desk</p><h2 id="studio-now-title">Questions I’m exploring.</h2></div>
      <div className="studio-now__items">
        <article><h3>AI tools people can inspect</h3><p>Research workflows and local AI, with the original evidence close enough to question. That’s the thread I’m following in Folio and ExplainLab.</p><a href="/projects/#folio">Explore Folio<span aria-hidden="true">↗</span></a></article>
        <article><h3>Game AI & simulation</h3><p>L2R’s research milestone is complete. My part included 10 SAC training runs, Related Work writing, and organising the team’s presentation. The next questions are about robust evaluation.</p><a href="/projects/#learn-to-race">Explore L2R<span aria-hidden="true">↗</span></a></article>
      </div>
    </section>
  </div>;
}
