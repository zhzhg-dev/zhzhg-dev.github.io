import { useId, useState } from "react";
import "./personal-home.css";

type Perspective = "build" | "think" | "explain";

const perspectives: {
  id: Perspective;
  label: string;
  title: string;
  description: string;
}[] = [
  {
    id: "build",
    label: "I build.",
    title: "Make something useful.",
    description: "I start with the person and the problem, then work towards a prototype I can test. AI interests me most when it makes a task clearer, easier, or genuinely possible.",
  },
  {
    id: "think",
    label: "I think.",
    title: "Keep the reasoning visible.",
    description: "My background in mathematics and computational science makes me curious about models, assumptions, and the evidence behind an answer. I want to understand where a system works—and where it does not.",
  },
  {
    id: "explain",
    label: "I explain.",
    title: "Make room for understanding.",
    description: "Helping students with introductory computing has taught me to slow down, ask a better question, and explain the same idea in a different way. Clarity is part of building.",
  },
];

export function PersonalHome() {
  const [selected, setSelected] = useState<Perspective>("build");
  const panelId = useId();
  const titleId = useId();
  const perspective = perspectives.find((item) => item.id === selected)!;

  return (
    <div className="personal-home">
      <section className="personal-home__hero" id="top" aria-labelledby={titleId}>
        <h1 className="personal-home__name" id={titleId} translate="no">
          <span>Grant</span>{" "}<span>Zhang.</span>
        </h1>

        <div className="personal-home__opening">
          <div className="personal-home__introduction">
            <p>
              I’m a Master of Information Technology student and Graduate Teaching
              Assistant at the University of Auckland.
            </p>

            <div
              className="personal-home__reading"
              id={panelId}
              role="region"
              aria-label="Personal perspective"
              aria-live="polite"
              aria-atomic="true"
            >
              <div className="personal-home__reading-copy" key={selected}>
                <h2>{perspective.title}</h2>
                <p>{perspective.description}</p>
              </div>
            </div>
          </div>

          <div className="personal-home__voices" role="group" aria-label="Ways I work">
            {perspectives.map((item) => (
              <button
                className="personal-home__voice"
                key={item.id}
                type="button"
                aria-pressed={selected === item.id}
                aria-controls={panelId}
                onClick={() => setSelected(item.id)}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

      </section>

      <section className="personal-home__background" aria-labelledby="personal-background-title">
        <h2 id="personal-background-title">Mathematics, AI,<br />and a classroom.</h2>
        <div className="personal-home__background-copy">
          <p>
            I’m based in Auckland, New Zealand. I studied Information and
            Computational Science before moving into Information Technology.
            I enjoy the space between a well-defined
            model and a messy, real-world question: understanding the need,
            building a prototype, and evaluating what actually works.
          </p>
          <p>
            At university, I support COMPSCI 111 laboratories and Open Lab
            sessions. Helping someone work through a bug is a good reminder
            that the person using a system matters as much as the system itself.
          </p>
          <p>
            Right now, I’m exploring AI product experiences, game AI,
            simulation, and model evaluation. I’m curious about how intelligent
            systems can support creative work without taking the human out of it.
          </p>
        </div>
      </section>

      <nav className="personal-home__next" aria-label="Explore my background and work">
        <a href="/experience/">
          <span className="personal-home__next-title">Experience</span>
          <span className="personal-home__next-description">Teaching, education, and the toolkit I work with.</span>
        </a>
        <a href="/projects/">
          <span className="personal-home__next-title">Projects</span>
          <span className="personal-home__next-description">What I’ve built, how it works, and what I learned.</span>
        </a>
      </nav>
    </div>
  );
}
