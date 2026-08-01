export type Link = {
  label: string;
  href: string;
};

export type Experience = {
  role: string;
  organisation: string;
  period: string;
  summary: string;
  points: string[];
};

export type Project = {
  title: string;
  eyebrow: string;
  description: string;
  technologies: string[];
  link: Link;
  featured?: boolean;
};

export type Education = {
  degree: string;
  institution: string;
  period: string;
  detail: string;
};

export const profile = {
  name: "Grant Zhang",
  alternativeName: "Zhang Zihang",
  headline:
    "Mathematics-trained problem solver building practical AI and software systems.",
  location: "Auckland, New Zealand",
  availability: "Open to internship and graduate opportunities",
  github: "https://github.com/zhzhg-dev",
  canonicalUrl: "https://zhzhg-dev.github.io/",
  about: [
    "I began with mathematics and theoretical modelling, then became increasingly interested in applying analytical ideas to real problems. That shift led me toward software engineering, machine learning, data systems, and practical technology projects.",
    "Teaching and community work have also shaped how I approach technical problems: explain the idea clearly, listen carefully, and make the next step useful for the person in front of me.",
  ],
};

export const navigation = [
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Skills", href: "#skills" },
  { label: "Education", href: "#education" },
  { label: "Community", href: "#community" },
];

export const experience: Experience[] = [
  {
    role: "Graduate Teaching Assistant",
    organisation: "University of Auckland · School of Computer Science",
    period: "Jul 2026 — present",
    summary:
      "Supporting students as they build confidence with introductory computing.",
    points: [
      "Support COMPSCI 111 laboratory classes and university Open Lab sessions.",
      "Help students understand introductory programming, debugging, development tools, file systems, and common technical issues.",
      "Support approximately 30 students across two COMPSCI 111 class groups.",
      "Adapt patient, practical explanations to different levels of experience.",
    ],
  },
  {
    role: "IELTS Teaching Assistant",
    organisation: "Luoyang New Oriental International Education",
    period: "Jun 2025 — Aug 2025",
    summary:
      "Helping teaching teams keep eight classes organised and students supported.",
    points: [
      "Supported IELTS teachers across eight classes during one teaching term.",
      "Helped prepare teaching activities, communicate with students, and maintain an organised learning environment.",
      "Worked in a supporting role alongside course teachers.",
    ],
  },
];

const githubFallback: Link = {
  label: "Details available on GitHub",
  href: profile.github,
};

export const projects: Project[] = [
  {
    title: "Learn-to-Race Autonomous Racing",
    eyebrow: "Current research direction · Group project",
    description:
      "A reinforcement-learning project in the Learn-to-Race simulation environment. The current direction explores demonstrations from a Model Predictive Control expert to warm-start a Soft Actor-Critic agent through imitation learning, aiming to improve sample efficiency and reduce early-stage training instability. Experimental work is ongoing.",
    technologies: [
      "Python",
      "Soft Actor-Critic",
      "Imitation learning",
      "MPC",
      "Simulation",
    ],
    link: githubFallback,
    featured: true,
  },
  {
    title: "Course Review and Campus Map Platform",
    eyebrow: "Team web application",
    description:
      "A MERN-stack platform for browsing and searching university course information. My contribution focused on backend APIs, MongoDB integration, keyword search, course sorting, deployment support, and connecting course information with map links.",
    technologies: [
      "React",
      "Node.js",
      "Express",
      "MongoDB",
      "REST APIs",
    ],
    link: githubFallback,
  },
  {
    title: "Svelte Study Planner",
    eyebrow: "Browser-based application",
    description:
      "A focused study-planning application for managing tasks and retaining information locally in the browser. Designed as a lightweight, responsive tool without a backend.",
    technologies: ["Svelte", "JavaScript", "localStorage", "Responsive design"],
    link: githubFallback,
  },
  {
    title: "Rumour Propagation Simulation",
    eyebrow: "Undergraduate research project",
    description:
      "A study of how rumours spread through heterogeneous cellular automata, connecting mathematical modelling with social and computational systems. The work formed my undergraduate thesis.",
    technologies: [
      "Mathematical modelling",
      "Cellular automata",
      "Simulation",
      "Complex systems",
    ],
    link: githubFallback,
  },
];

export const skills = [
  {
    category: "Programming",
    items: ["Python", "Java", "JavaScript", "TypeScript", "C", "C++"],
  },
  {
    category: "Web & backend",
    items: [
      "React",
      "Svelte",
      "Node.js",
      "Express",
      "REST APIs",
      "MongoDB",
      "Mongoose",
      "HTML",
      "CSS",
    ],
  },
  {
    category: "AI & data",
    items: [
      "Machine learning",
      "Reinforcement learning",
      "Data analysis",
      "Mathematical modelling",
      "scikit-learn",
      "pandas",
      "NumPy",
    ],
  },
  {
    category: "Tools",
    items: [
      "Git",
      "GitHub",
      "GitHub Actions",
      "Docker",
      "VS Code",
      "Postman",
    ],
  },
];

export const education: Education[] = [
  {
    degree: "Master of Information Technology",
    institution: "University of Auckland",
    period: "2026 — present",
    detail: "Current cumulative GPA: 6.0 / 9.0",
  },
  {
    degree: "Bachelor of Science in Information and Computational Science",
    institution: "Southwest Minzu University",
    period: "2020 — 2024",
    detail:
      "2nd in cohort by comprehensive assessment · Thesis: Rumor Propagation Model Based on Heterogeneous Cellular Automata",
  },
];

export const community = {
  title: "National ‘Three Rural Areas’ social-practice team",
  distinction: "National Outstanding Team award",
  description:
    "I supported faculty advisers with itinerary planning and task scheduling while participating directly in community practice activities. The experience strengthened my coordination and communication, and gave me a clearer understanding of differences in access to education and technology.",
};
