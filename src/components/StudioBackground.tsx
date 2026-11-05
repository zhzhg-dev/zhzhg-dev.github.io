import { useEffect, useRef } from "react";
import { community, education, experience } from "../data/profile";
import { backgroundZh } from "../data/background.zh";
import { useLanguage } from "../i18n";
import "./studio-background.css";

export function StudioBackground({ compact = false }: { compact?: boolean }) {
  const { language, t, href } = useLanguage();
  const background = language === "zh" ? backgroundZh : { community, education, experience };
  const backgroundRoot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const target = window.location.hash.slice(1);
    if (["work-title", "education-title", "community-title"].includes(target)) {
      backgroundRoot.current?.querySelector(`[aria-labelledby="${target}"]`)?.scrollIntoView({ behavior: "instant", block: "start" });
    }
  }, []);
  return <div ref={backgroundRoot} className={"studio-background" + (compact ? " studio-background--compact" : "")}>
    <div className="background-journey">
    <section className="background-work" aria-labelledby="work-title">
      <header className="background-heading"><h2 id="work-title" tabIndex={-1}>{t("Work & teaching", "工作与教学")}</h2></header>
      <ol className="background-work__list">
        {background.experience.map(role => {
          const current = role.status === "current";
          const story = role.story;
          return <li className={"background-work__entry" + (current ? " background-work__entry--current" : "")} key={role.role}>
            <p className="background-work__period">{role.period}</p>
            <article className="background-role"><p className="background-role__organisation">{role.organisation}</p><h3>{role.role}</h3><p className="background-role__summary">{role.summary}</p>
              {!compact && role.scope && <p className="background-role__scope">{role.scope}</p>}
              {!compact && story && <details className="background-role__details" open>
                <summary>{t("Details & outcomes", "工作与成果")}<span aria-hidden="true">+</span></summary>
                <dl className="background-role__story">
                  <div><dt>{t("Context", "背景")}</dt><dd>{story.situation}</dd></div>
                  <div><dt>{t("Task", "任务")}</dt><dd>{story.task}</dd></div>
                  <div><dt>{t("What I did", "我的行动")}</dt><dd>{story.action}</dd></div>
                  <div className="background-role__result"><dt>{t("Outcome", "成果")}</dt><dd>{story.result}{story.evidenceNote && <small>{story.evidenceNote}</small>}</dd></div>
                </dl>
              </details>}
            </article>
          </li>;
        })}
      </ol>
      {compact && <a className="background-work__more" href={href("/experience/#work-title")}>{t("Full background", "查看完整经历")}<span aria-hidden="true">↗</span></a>}
    </section>

    <section className="background-education" aria-labelledby="education-title">
      <h2 id="education-title" tabIndex={-1}>{t("Education", "教育背景")}</h2>
      <div className="background-education__list">{background.education.map(item => <article key={item.degree}>
        <p className="background-education__period">{item.period}</p>
        <h3>{item.degree}</h3>
        <p className="background-education__institution">{item.institution}</p>
        {item.detail && <p className="background-education__detail">{item.detail}</p>}
        {item.courseGroups.map(group => <div className="background-education__group" key={group.label}>
          <h4>{group.label}</h4>
          <ul>{group.courses.map(course => <li key={course}>{course}</li>)}</ul>
        </div>)}
        {item.honours && <div className="background-education__group">
          <h4>{t("Honours", "荣誉")}</h4>
          <ul>{item.honours.map(honour => <li key={honour}>{honour}</li>)}</ul>
        </div>}
      </article>)}</div>
      {compact && <a className="background-education__more" href={href("/experience/#education-title")}>{t("Courses & honours", "查看课程与荣誉")}<span aria-hidden="true">↗</span></a>}
    </section>
    </div>

    <aside className="background-community" aria-labelledby="community-title">
      <div className="background-community__intro">
        <p className="background-community__label">{t("Volunteering", "志愿活动")}</p>
        <h2 id="community-title" tabIndex={-1}>{background.community.distinction}</h2>
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
