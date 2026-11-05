import { backgroundZh } from "../data/background.zh";
import { skills } from "../data/profile";
import { useLanguage } from "../i18n";
import "./studio-toolkit.css";

export function StudioToolkit() {
  const { language, t } = useLanguage();
  const groups = language === "zh" ? backgroundZh.skills : skills;

  return <section className="studio-toolkit" aria-labelledby="toolkit-title">
    <header className="studio-toolkit__heading">
      <h2 id="toolkit-title">{t("My toolkit", "我的工具箱")}</h2>
      <p>{t("For turning a question into something you can try.", "把一个问题，变成可以动手试的东西。")}</p>
    </header>
    <div className="studio-toolkit__groups">
      {groups.map(group => <div className="studio-toolkit__group" key={group.category}>
        <h3>{group.category}</h3>
        <ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul>
      </div>)}
    </div>
  </section>;
}
