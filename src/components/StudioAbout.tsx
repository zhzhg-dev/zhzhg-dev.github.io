import "./studio-about.css";
import { useLanguage } from "../i18n";

export function StudioAbout() {
  const { t, href } = useLanguage();
  return <div className="studio-about-display">
    <section className="studio-about" id="studio-about" aria-labelledby="studio-about-title">
      <div className="studio-about__heading">
        <h2 id="studio-about-title">{t("A little", "关于我，")}<br />{t("about me.", "多一点。")}</h2>
      </div>
      <div className="studio-about__copy">
        <p>{t("I’m Grant, a Master of Information Technology student and Graduate Teaching Assistant at the University of Auckland.", "我是 Grant，目前在奥克兰大学攻读信息技术硕士，同时担任研究生助教。")}</p>
        <p>{t("I came to computing through mathematics and computational science. These days, I’m interested in AI products, game AI, and simulation: making something useful, then understanding where it works and where it doesn’t.", "我从数学和计算科学走进计算机领域。现在，我关注 AI 产品、游戏 AI 与仿真：先做出有用的东西，再认真弄清楚它在什么情况下有效，又在哪里会失灵。")}</p>
        <p>{t("Teaching keeps the person on the other side of the screen in mind. A good explanation matters just as much to me as a working piece of code.", "教学让我始终记得，屏幕另一端是一个真实的人。对我来说，把一件事讲清楚，和让一段代码跑起来同样重要。")}</p>
        <ul className="studio-about__threads" aria-label={t("The threads in my work", "贯穿我工作的兴趣")}><li>{t("Mathematics", "数学")}</li><li>{t("AI product experiences", "AI 产品体验")}</li><li>{t("Teaching & learning", "教学与学习")}</li></ul>
      </div>
    </section>

    <section className="studio-now" aria-labelledby="studio-now-title">
      <div className="studio-now__intro"><h2 id="studio-now-title">{t("What I’m exploring.", "最近在探索。")}</h2><p>{t("Two interests I keep coming back to.", "两个让我不断追问的方向。")}</p></div>
      <div className="studio-now__items">
        <article className="studio-now__research"><p className="studio-now__context" translate="no">Folio & ExplainLab</p><h3>{t("AI tools people", "让 AI 工具")}<br />{t("can inspect", "经得起追问")}</h3><p>{t("Keep the original evidence close. Make the assumptions visible. Let a person try an idea and question the result.", "保留原始证据，写清模型假设。让使用者能亲手验证一个想法，也能对结果提出疑问。")}</p><a href={href("/projects/#folio")}>{t("Explore Folio", "看看 Folio")}<span aria-hidden="true">↗</span></a></article>
        <article className="studio-now__simulation"><p className="studio-now__context">{t("L2R research", "L2R 研究")}</p><h3>{t("Game AI & simulation", "游戏 AI 与仿真")}</h3><p>{t("L2R’s research milestone is complete. My part included 10 SAC training runs, Related Work writing, and organising the team’s presentation. The next questions are about robust evaluation.", "L2R 已完成阶段性研究。我负责了 10 次 SAC 训练、报告的 Related Work 部分，并参与组织团队展示。接下来，我想继续探索更稳健的评估方式。")}</p><a href={href("/projects/#learn-to-race")}>{t("Explore L2R", "看看 L2R")}<span aria-hidden="true">↗</span></a></article>
      </div>
    </section>
  </div>;
}
