import type { Education, Experience } from "./profile";

// Localised copy only. Dates, roles, qualifications and contribution boundaries
// mirror the verified English record in profile.ts.
export const backgroundZh = {
  experience: [
    {
      role: "研究生助教",
      organisation: "奥克兰大学 · 计算机科学学院",
      period: "2026 年 7 月 — 至今",
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
    title: "全国“三下乡”社会实践团队",
    distinction: "全国优秀团队",
    description: "我协助指导老师规划行程、安排任务，并直接参与社会实践活动。这段经历锻炼了我的协调与沟通能力，也让我更具体地理解教育与技术资源获取上的差异。",
  },
};
