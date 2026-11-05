import { useEffect, useRef } from "react";
import { community, education, experience, skills } from "../data/profile";
import { backgroundZh } from "../data/background.zh";
import { useLanguage } from "../i18n";
import "./studio-background.css";

export function StudioBackground({ compact = false }: { compact?: boolean }) {
  const { language, t, href } = useLanguage();
  const background = language === "zh" ? backgroundZh : { community, education, experience, skills };
  const communityCard = useRef<HTMLElement>(null);
  useEffect(() => {
    if (window.location.hash === "#community-title") {
      communityCard.current?.scrollIntoView({ behavior: "instant", block: "start" });
    }
  }, []);
  return <div className={"studio-background" + (compact ? " studio-background--compact" : "")}>
    <div className="background-journey">
    <section className="background-work" aria-labelledby="work-title">
      <header className="background-heading"><h2 id="work-title">{t("Work & teaching", "工作与教学")}</h2><p>{t("Learning goes both ways.", "教与学，从来都是双向的。")}</p></header>
      <ol className="background-work__list">
        {background.experience.map((role, index) => {
          const current = role.status === "current";
          return <li className={"background-work__entry" + (current ? " background-work__entry--current" : "")} key={index}>
            <p className="background-work__period">{role.period}</p>
            <article className="background-role"><p className="background-role__organisation">{role.organisation}</p><h3>{role.role}</h3><p className="background-role__summary">{role.summary}</p>
              {role.points.length > 0 && (compact ? current && <ul className="background-role__highlights">{role.points.slice(0, 2).map(point => <li key={point}>{point}</li>)}</ul> : <details className="background-role__details" open={current}><summary>{t("Responsibilities", "工作内容")}<span aria-hidden="true">+</span></summary><ul>{role.points.map(point => <li key={point}>{point}</li>)}</ul></details>)}
              {!compact && role.tags.length > 0 && <ul className="background-role__tags" aria-label={t(`${role.role} capabilities`, `${role.role}相关能力`)}>{role.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>}
            </article>
          </li>;
        })}
      </ol>
      {compact && <a className="background-work__more" href={href("/experience/#work-title")}>{t("Full background", "查看完整经历")}<span aria-hidden="true">↗</span></a>}
    </section>

    <section className="background-education" aria-labelledby="education-title">
      <h2 id="education-title">{t("Education", "教育背景")}</h2>
      <p className="background-education__intro">{t("The foundations I’m building on.", "支撑我继续探索的基础。")}</p>
      <div className="background-education__list">{background.education.map((item, index) => <article key={index}><p className="background-education__period">{item.period}</p><h3>{item.degree}</h3><p className="background-education__institution">{item.institution}</p><p className="background-education__detail">{item.detail}</p></article>)}</div>
    </section>
    </div>

    <section className="background-toolkit" aria-labelledby="toolkit-title">
      <header className="background-heading"><h2 id="toolkit-title">{t("My toolkit", "我的工具箱")}</h2><p>{t("For turning a question into something you can try.", "把一个问题，变成可以动手试的东西。")}</p></header>
      <div className="background-toolkit__list">{background.skills.map((group, index) => <article key={index}><h3>{group.category}</h3><ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul></article>)}</div>
    </section>

    <aside ref={communityCard} className="background-community" aria-labelledby="community-title">
      <div className="background-community__intro">
        <p className="background-community__label">{t("Volunteering", "志愿活动")}</p>
        <h2 id="community-title">{background.community.distinction}</h2>
        <p className="background-community__recognition">{background.community.recognition}</p>
        <p className="background-community__overview">{background.community.overview}</p>
      </div>
      <div className="background-community__entries">
        {background.community.entries.map(entry => <article className="background-community__entry" key={entry.id} aria-labelledby={`volunteering-${entry.id}`}>
          <p className="background-community__period">{entry.period}</p>
          <h3 id={`volunteering-${entry.id}`}>{entry.title}</h3>
          <p className="background-community__organisation">{entry.organisation}</p>
          <p className="background-community__copy">{entry.description}</p>
          {entry.contribution && <p className="background-community__copy">{entry.contribution}</p>}
          <a className="background-community__source" href={entry.reportUrl} target="_blank" rel="noreferrer" aria-label={`${t("School report (Chinese)", "阅读学院报道")}：${entry.title}`}>{t("School report (Chinese)", "阅读学院报道")}<span aria-hidden="true">↗</span></a>
        </article>)}
      </div>
    </aside>
  </div>;
}
