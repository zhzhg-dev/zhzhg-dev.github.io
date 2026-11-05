import { communityReportUrls, type Community, type Education, type Experience } from "./profile";

// Localised copy only. Dates, roles, qualifications and contribution boundaries
// mirror the verified English record in profile.ts.
export const backgroundZh = {
  experience: [
    {
      role: "游戏 AI 产品管理实习生",
      organisation: "腾讯光子工作室群",
      period: "计划于 2026 年 11 月 16 日入职",
      summary: "新西兰奥克兰。",
      status: "upcoming",
      points: [],
      tags: [],
    },
    {
      role: "研究生助教",
      organisation: "奥克兰大学 · 计算机科学学院",
      period: "2026 年 7 月 — 2026 年 11 月 16 日（预计结束）",
      status: "current",
      summary: "帮助学生在计算机入门学习中建立信心。",
      points: [
        "协助开展 COMPSCI 111 实验课与大学 Open Lab 开放实验室。",
        "帮助学生理解编程基础、调试、开发工具、文件系统，并解决常见技术问题。",
        "为两个 COMPSCI 111 班组约 30 名学生提供学习支持。",
        "根据学生的经验水平，提供耐心、具体的讲解。",
      ],
      tags: ["技术沟通", "调试", "教学"],
    },
    {
      role: "雅思助教",
      organisation: "洛阳新东方国际教育",
      period: "2025 年 6 月 — 2025 年 8 月",
      summary: "协助教学团队管理八个班级，为学生提供学习支持。",
      points: [
        "在一个教学周期内，协助雅思教师开展八个班级的教学。",
        "准备教学活动、与学生沟通，协助维持有序的学习环境。",
        "与任课教师紧密配合，保障日常教学顺利开展。",
      ],
      tags: ["沟通", "协调", "学生支持"],
    },
  ] satisfies Experience[],
  education: [
    {
      degree: "信息技术硕士",
      institution: "奥克兰大学",
      period: "2026 年 — 至今",
      detail: "当前累计 GPA：6.0 / 9.0",
    },
    {
      degree: "信息与计算科学 · 理学学士",
      institution: "西南民族大学",
      period: "2020 年 — 2024 年",
      detail: "综合测评专业第 2 名 · 毕业论文：基于异质元胞自动机的谣言传播模型",
    },
  ] satisfies Education[],
  skills: [
    { category: "产品与评估", items: ["需求分析", "原型设计", "研究工作流", "模型评估", "证据审查", "技术沟通"] },
    { category: "编程语言", items: ["Python", "Java", "JavaScript", "TypeScript", "C", "C++"] },
    { category: "Web 与后端", items: ["React", "Svelte", "Node.js", "Express", "REST APIs", "MongoDB", "HTML", "CSS"] },
    { category: "AI 与数据", items: ["机器学习", "强化学习", "数据分析", "数学建模", "端侧 AI", "检索评估", "scikit-learn", "pandas", "NumPy"] },
    { category: "开发工具", items: ["Git", "GitHub Actions", "Docker", "VS Code", "Postman"] },
  ],
  community: {
    distinction: "国家级优秀团队",
    recognition: "2022 年红原实践团队获全国暑期社会实践优秀团队表彰。",
    overview: "两年暑期，我和同学为川西偏远地区的孩子上课，到草原协助牧民，也参与科研基地的现场工作。",
    entries: [
      {
        id: "hongyuan",
        title: "红原县数学科普",
        organisation: "西南民族大学数学学院 · “格桑花”宣讲团",
        period: "2022 年暑期",
        description: "我们赴红原县开展科普宣讲，把数学知识带进高原牧区。",
        contribution: "我全程参与活动，并以数学学院学生会宣传部负责人的身份撰写了学院发布的红原实践报道。",
        reportUrl: communityReportUrls.hongyuan,
      },
      {
        id: "xiangcheng",
        title: "乡城县暑期实践",
        organisation: "西南民族大学数学学院",
        period: "2021 年暑期",
        description: "我随数学学院赴四川甘孜州乡城县，与同学一起参与当地的暑期帮扶活动。",
        reportUrl: communityReportUrls.xiangcheng,
      },
    ],
  } satisfies Community,
};
