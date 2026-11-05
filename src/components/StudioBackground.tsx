import { community, education, experience, skills } from "../data/profile";
import { backgroundZh } from "../data/background.zh";
import { useLanguage } from "../i18n";
import "./studio-background.css";

export function StudioBackground({ compact = false }: { compact?: boolean }) {
  const { language, t, href } = useLanguage();
  const background = language === "zh" ? backgroundZh : { community, education, experience, skills };
  return <div className={"studio-background" + (compact ? " studio-background--compact" : "")}>
    <div className="background-journey">
    <section className="background-work" aria-labelledby="work-title">
      <header className="background-heading"><h2 id="work-title">{t("Work & teaching", "工作与教学")}</h2><p>{t("Learning goes both ways.", "教与学，从来都是双向的。")}</p></header>
      <ol className="background-work__list">
        {background.experience.map((role, index) => <li className={"background-work__entry" + (index === 0 ? " background-work__entry--current" : "")} key={index}>
          <p className="background-work__period">{role.period}</p>
          <article className="background-role"><p className="background-role__organisation">{role.organisation}</p><h3>{role.role}</h3><p className="background-role__summary">{role.summary}</p>
            {compact ? index === 0 && <ul className="background-role__highlights">{role.points.slice(0, 2).map(point => <li key={point}>{point}</li>)}</ul> : <><details className="background-role__details" open={index === 0}><summary>{t("Responsibilities", "工作内容")}<span aria-hidden="true">+</span></summary><ul>{role.points.map(point => <li key={point}>{point}</li>)}</ul></details><ul className="background-role__tags" aria-label={t(`${role.role} capabilities`, `${role.role}相关能力`)}>{role.tags.map(tag => <li key={tag}>{tag}</li>)}</ul></>}
          </article>
        </li>)}
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

    <aside className="background-community" aria-labelledby="community-title">
      <div><h2 id="community-title">{t("Outside the classroom", "课堂之外")}</h2><p className="background-community__award">{background.community.distinction}</p></div>
      <div><h3>{background.community.title}</h3><p>{background.community.description}</p></div>
    </aside>
  </div>;
}
