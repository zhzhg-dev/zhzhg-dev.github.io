import "./studio-about.css";

export function StudioAbout() {
  return <div className="studio-about-display">
    <section className="studio-about" id="studio-about" aria-labelledby="studio-about-title">
      <div className="studio-about__heading">
        <h2 id="studio-about-title">A little<br />about me.</h2>
      </div>
      <div className="studio-about__copy">
        <p>I’m Grant, a Master of Information Technology student and Graduate Teaching Assistant at the University of Auckland.</p>
        <p>I came to computing through mathematics and computational science. These days, I’m interested in AI products, game AI, and simulation: making something useful, then understanding where it works and where it doesn’t.</p>
        <p>Teaching keeps the person on the other side of the screen in mind. A good explanation matters just as much to me as a working piece of code.</p>
        <ul className="studio-about__threads" aria-label="The threads in my work"><li>Mathematics</li><li>AI product experiences</li><li>Teaching & learning</li></ul>
      </div>
    </section>

    <section className="studio-now" aria-labelledby="studio-now-title">
      <div className="studio-now__intro"><h2 id="studio-now-title">What I’m exploring.</h2><p>Two interests I keep coming back to.</p></div>
      <div className="studio-now__items">
        <article className="studio-now__research"><p className="studio-now__context">Folio & ExplainLab</p><h3>AI tools people<br />can inspect</h3><p>Keep the original evidence close. Make the assumptions visible. Let a person try an idea and question the result.</p><a href="/projects/#folio">Explore Folio<span aria-hidden="true">↗</span></a></article>
        <article className="studio-now__simulation"><p className="studio-now__context">L2R research</p><h3>Game AI & simulation</h3><p>L2R’s research milestone is complete. My part included 10 SAC training runs, Related Work writing, and organising the team’s presentation. The next questions are about robust evaluation.</p><a href="/projects/#learn-to-race">Explore L2R<span aria-hidden="true">↗</span></a></article>
      </div>
    </section>
  </div>;
}
