import "./studio-about.css";
import { useLanguage } from "../i18n";

// Small margin drawings, not plots of experimental results.
function NotebookDrawing({ type }: { type: "track" | "source" }) {
  return <svg className="studio-now__drawing" width="84" height="58" viewBox="0 0 84 58" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {type === "track" ? <>
      <path d="M12 29C12 16 26 8 37 11c9 3 7 12 15 12 7 0 12-9 20-4 9 6 2 21-7 25-10 5-16-5-23-5-8 0-12 10-22 5-6-3-9-8-8-15Z" />
      <path d="M18 29c0-9 11-16 18-12 5 3 7 12 16 12 10 0 14-9 18-6 5 4-2 14-8 16-7 3-12-6-21-6-10 0-13 10-20 5-3-2-4-6-3-9Z" />
      <path d="m24 12 4 7m-7-5 4 7" strokeWidth="2.5" />
    </> : <>
      <path d="m20 12 31-4 5 36-31 4z" />
      <path d="m32 14 31 3-3 34-31-3z" fill="var(--note-paper)" />
      <path d="m38 24 17 2m-18 4 13 1m-13 5 8 1" />
      <path d="m57 33 6-5 6 1m-6-1-1 6" />
    </>}
  </svg>;
}

export function StudioAbout() {
  const { t, href } = useLanguage();
  return <div className="studio-about-display">
    <section className="studio-about" id="studio-about" aria-labelledby="studio-about-title">
      <div className="studio-about__heading">
        <h2 id="studio-about-title">{t("A little", "关于我，")}<br />{t("about me.", "多一点。")}</h2>
      </div>
      <div className="studio-about__copy">
        <p>{t("I came to computing through mathematics. I’m studying for a Master of Information Technology at the University of Auckland alongside my work in game AI.", "我从数学走进计算机领域。现在，我一边做游戏 AI，一边在奥克兰大学攻读信息技术硕士。")}</p>
        <p>{t("When I was a teaching assistant for COMPSCI 111, I often sat beside a student to work through a bug. I still like working that way: try one small change together and see what it tells us.", "以前做 COMPSCI 111 助教时，我常和学生坐在一起排查报错。我现在依然喜欢这种方式：一起改一个小地方，再看看结果说明了什么。")}</p>
      </div>
    </section>

    <section className="studio-now" aria-labelledby="studio-now-title">
      <div className="studio-now__intro"><h2 id="studio-now-title">{t("What I’m exploring.", "最近在探索。")}</h2><p>{t("Two questions from my university and personal projects.", "我在课程研究和个人项目里追问的两个问题。")}</p></div>
      <div className="studio-now__items">
        <article className="studio-now__simulation">
          <div className="studio-now__margin"><p className="studio-now__context">{t("L2R / University research", "L2R / 课程研究")}</p><NotebookDrawing type="track" /></div>
          <h3>{t("What happens on a new track?", "换条赛道，还会开吗？")}</h3>
          <p>{t("Our team trained racing agents and tested them on unfamiliar tracks in simulation. I ran 10 SAC training runs, about 20 million environment steps in total.", "我们训练赛车智能体，再把它放进没见过的仿真赛道。我负责了 10 次 SAC 训练，合计约 2,000 万个环境步。")}</p>
          <a href={href("/projects/#learn-to-race")}>{t("Read the L2R study", "看 L2R 实验")}<span aria-hidden="true">↗</span></a>
        </article>
        <article className="studio-now__research">
          <div className="studio-now__margin"><p className="studio-now__context">{t("Folio / Personal project", "Folio / 个人项目")}</p><NotebookDrawing type="source" /></div>
          <h3>{t("Can I trace this claim?", "这句话的依据在哪？")}</h3>
          <p>{t("In Folio, a citation leads back to the passage and version I read, even after a source changes. In ExplainLab, I take a different route to the same idea: change an input and watch what happens.", "在 Folio 里，即使资料更新，引用仍能带我回到当时读的那段原文。做 ExplainLab 时我换了种方式：让人亲手改一个输入，看结果怎么变。")}</p>
          <div className="studio-now__links"><a href={href("/projects/#folio")}>{t("Inside Folio", "看看 Folio")}<span aria-hidden="true">↗</span></a><a href={href("/projects/#explainlab")}>{t("Explore ExplainLab", "看看 ExplainLab")}<span aria-hidden="true">↗</span></a></div>
        </article>
      </div>
    </section>
  </div>;
}
