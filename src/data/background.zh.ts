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
      scope: "岗位方向是探索生成式 AI 和智能体在游戏中的应用，评估模型与智能体的能力，并将应用场景整理为产品需求。",
    },
    {
      role: "研究生助教",
      organisation: "奥克兰大学 · 计算机科学学院",
      period: "2026 年 7 月 — 2026 年 11 月 16 日（预计结束）",
      status: "current",
      summary: "每周协助两组 COMPSCI 111 实验课，覆盖约 30 名学生，也在 Open Lab 提供答疑。",
      story: {
        situation: "计算机入门实验课的学生编程基础不同，遇到的问题也各不相同。",
        task: "帮助学生读懂实验和作业要求、配置开发工具，并学会独立排查问题。",
        action: "在实验课上结合操作讲解网页基础、文件系统和入门编程；在 Open Lab 拆解作业要求，协助安装软件，并带学生逐步定位报错。",
        result: "每周为两组 COMPSCI 111 实验课约 30 名学生提供实践指导，另外在 Open Lab 为有需要的学生答疑。",
      },
    },
    {
      role: "融媒采编",
      organisation: "洛阳广播电视台 · 融媒中心",
      period: "2024 年 1 月 — 2024 年 3 月",
      summary: "在三个月的毕业实习中，参与洛阳电视台《新闻联播》及新媒体报道，《二里头绿松石龙形器》短视频获实习生署名。",
      story: {
        situation: "融媒中心同时制作洛阳电视台《新闻联播》和面向新媒体平台的短视频报道。",
        task: "配合记者和制作同事开展电视新闻与新媒体采编，按播出时限准备素材。",
        action: "协助采访、撰稿、配音和音视频剪辑，与团队核对镜头取舍、成片时长、音质及交付文件。",
        result: "参与制作洛阳电视台《新闻联播》，并在「洛阳融媒」微信视频号发布的《二里头绿松石龙形器》中获得实习生署名。截图记录该条视频获 235 次点赞、155 次转发和 5 条评论。",
        evidenceNote: "数据来自「洛阳融媒」视频号截图，为该条视频的互动记录，不代表个人业绩。",
      },
    },
  ] satisfies Experience[],
  education: [
    {
      degree: "信息技术硕士",
      institution: "奥克兰大学",
      period: "2026 年 — 至今",
      courseGroups: [
        { label: "机器学习与数据", courses: ["机器学习基础", "机器学习高级专题", "健康数据分析"] },
        { label: "软件与数据库", courses: ["可维护软件开发", "软件工具与技术", "高级数据库系统专题"] },
        { label: "建模与咨询", courses: ["系统动力学与复杂建模", "IT 咨询"] },
      ],
    },
    {
      degree: "信息与计算科学 · 理学学士",
      institution: "西南民族大学",
      period: "2020 年 — 2024 年",
      detail: "综合测评专业第 2 名 · 毕业论文：基于异质元胞自动机的谣言传播模型",
      courseGroups: [
        { label: "计算机", courses: ["数据结构与算法", "面向对象程序设计"] },
        { label: "数学", courses: ["数学分析", "高等代数", "概率论"] },
      ],
      honours: ["优秀毕业生", "优秀学生", "四川省大学生综合素质 A 级证书"],
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
