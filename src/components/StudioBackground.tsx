import { community, education, experience, skills } from "../data/profile";
import "./studio-background.css";

export function StudioBackground({ compact = false }: { compact?: boolean }) {
  return <div className={"studio-background" + (compact ? " studio-background--compact" : "")}>
    <section className="background-work" aria-labelledby="work-title">
      <header className="background-heading"><h2 id="work-title">Work & teaching</h2><div><p>Patient explanations, practical problem-solving, and learning with other people.</p>{compact && <a href="/experience/#work-title">Full background<span aria-hidden="true">↗</span></a>}</div></header>
      <ol className="background-work__list">
        {experience.map((role, index) => <li className={"background-work__entry" + (index === 0 ? " background-work__entry--current" : "")} key={role.role}>
          <p className="background-work__period">{role.period}</p>
          <article className="background-role"><p className="background-role__organisation">{role.organisation}</p><h3>{role.role}</h3><p className="background-role__summary">{role.summary}</p>
            {compact ? index === 0 && <ul className="background-role__highlights">{role.points.slice(0, 2).map(point => <li key={point}>{point}</li>)}</ul> : <><details className="background-role__details" open={index === 0}><summary>Responsibilities<span aria-hidden="true">+</span></summary><ul>{role.points.map(point => <li key={point}>{point}</li>)}</ul></details><ul className="background-role__tags" aria-label={role.role + " capabilities"}>{role.tags.map(tag => <li key={tag}>{tag}</li>)}</ul></>}
          </article>
        </li>)}
      </ol>
    </section>

    <section className="background-education" aria-labelledby="education-title">
      <h2 id="education-title">Education</h2>
      <div className="background-education__list">{education.map(item => <article key={item.degree}><p className="background-education__period">{item.period}</p><h3>{item.degree}</h3><p className="background-education__institution">{item.institution}</p><p className="background-education__detail">{item.detail}</p></article>)}</div>
    </section>

    <section className="background-toolkit" aria-labelledby="toolkit-title">
      <header className="background-heading"><h2 id="toolkit-title">My toolkit</h2><p>The tools I use across product work, software, and modelling.</p></header>
      <div className="background-toolkit__list">{skills.map(group => <article key={group.category}><h3>{group.category}</h3><ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul></article>)}</div>
    </section>

    <aside className="background-community" aria-labelledby="community-title">
      <div><h2 id="community-title">Outside the classroom</h2><p className="background-community__award">{community.distinction}</p></div>
      <div><h3>{community.title}</h3><p>{community.description}</p></div>
    </aside>
  </div>;
}
