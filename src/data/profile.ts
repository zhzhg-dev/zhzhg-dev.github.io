export type Experience = {
  role: string;
  organisation: string;
  period: string;
  summary: string;
  points: string[];
  tags: string[];
};

export type Project = {
  slug: string;
  title: string;
  eyebrow: string;
  status: string;
  description: string;
  technologies: string[];
  cover: string;
  coverAlt: string;
  liveUrl?: string;
  sourceUrl?: string;
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
    "I began with mathematics and theoretical modelling, then became increasingly interested in turning analytical ideas into software people can use.",
    "Today I work across machine learning, data systems, and full-stack development. Teaching has shaped the way I build: make the difficult idea clear, test the next step, and keep the person using the system in view.",
  ],
};

export const navigation = [
  { label: "Home", href: "/", page: "home" },
  { label: "Experience", href: "/experience/", page: "experience" },
  { label: "Projects", href: "/projects/", page: "projects" },
] as const;

export const experience: Experience[] = [
  {
    role: "Graduate Teaching Assistant",
    organisation: "University of Auckland · School of Computer Science",
    period: "Jul 2026 — Present",
    summary:
      "Supporting students as they build confidence with introductory computing.",
    points: [
      "Support COMPSCI 111 laboratory classes and university Open Lab sessions.",
      "Help students understand introductory programming, debugging, development tools, file systems, and common technical issues.",
      "Support approximately 30 students across two COMPSCI 111 class groups.",
      "Adapt patient, practical explanations to different levels of experience.",
    ],
    tags: ["Technical communication", "Debugging", "Teaching"],
  },
  {
    role: "IELTS Teaching Assistant",
    organisation: "Luoyang New Oriental International Education",
    period: "Jun 2025 — Aug 2025",
    summary:
      "Helping teaching teams keep eight classes organised and students supported.",
    points: [
      "Supported IELTS teachers across eight classes during one teaching term.",
      "Prepared teaching activities, communicated with students, and helped maintain an organised learning environment.",
      "Worked closely with course teachers to keep day-to-day delivery dependable.",
    ],
    tags: ["Communication", "Coordination", "Student support"],
  },
];

export const projects: Project[] = [
  {
    slug: "learn-to-race",
    title: "Learn-to-Race Autonomous Racing",
    eyebrow: "Reinforcement learning · Group research",
    status: "Research in progress",
    description:
      "Exploring demonstrations from a Model Predictive Control expert to warm-start a Soft Actor-Critic agent through imitation learning, with the goal of improving sample efficiency and reducing early-stage training instability.",
    technologies: [
      "Python",
      "Soft Actor-Critic",
      "Imitation learning",
      "MPC",
      "Simulation",
    ],
    cover: "/projects/autonomous-racing.webp",
    coverAlt:
      "Abstract autonomous racing simulation with cyan and amber control trajectories",
    featured: true,
  },
  {
    slug: "nz-electricity-forecasting",
    title: "NZ Electricity Intelligence",
    eyebrow: "Machine learning · Energy analytics",
    status: "Live ML demo",
    description:
      "An end-to-end forecasting system trained on 52,608 New Zealand electricity-market periods. It predicts Upper North Island demand across four horizons, estimates wholesale price-spike risk, and presents model uncertainty and explanations in an interactive dashboard. The 1-hour model achieved a 17.2 MW MAE on the untouched 2025 holdout—76.9% better than the strongest seasonal baseline.",
    technologies: [
      "Python",
      "scikit-learn",
      "Time series",
      "Streamlit",
      "GitHub Actions",
    ],
    cover: "/projects/nz-electricity-forecast.png",
    coverAlt:
      "NZ Electricity Intelligence dashboard showing market coverage and demand forecast metrics",
    liveUrl: "https://nz-electricity-forecasting.streamlit.app/",
    sourceUrl: "https://github.com/zhzhg-dev/nz-electricity-forecasting",
    featured: true,
  },
  {
    slug: "course-review-system",
    title: "Course Review & Campus Platform",
    eyebrow: "Full-stack team application",
    status: "Live demo",
    description:
      "A MERN-platform for browsing university course information and campus discussions. My contribution focused on backend APIs, MongoDB integration, keyword search, course sorting, deployment support, and map links.",
    technologies: ["React", "Node.js", "Express", "MongoDB", "REST APIs"],
    cover: "/projects/course-review.webp",
    coverAlt: "Course Review System live demo home page",
    liveUrl: "https://zhzhg-dev.github.io/course-review-system/",
    sourceUrl: "https://github.com/zhzhg-dev/course-review-system",
    featured: true,
  },
  {
    slug: "svelte-study-planner",
    title: "Svelte Study Planner",
    eyebrow: "Browser-based application",
    status: "Live demo",
    description:
      "A focused study-planning application for creating, filtering, and completing tasks with progress summaries and local browser persistence—responsive, fast, and backend-free.",
    technologies: ["SvelteKit", "JavaScript", "localStorage", "Responsive UI"],
    cover: "/projects/study-planner.webp",
    coverAlt: "Svelte Study Planner live demo dashboard",
    liveUrl: "https://zhzhg-dev.github.io/svelte-study-planner/",
    sourceUrl: "https://github.com/zhzhg-dev/svelte-study-planner",
    featured: true,
  },
  {
    slug: "rumour-propagation",
    title: "Rumour Propagation Simulation",
    eyebrow: "Undergraduate research project",
    status: "Undergraduate thesis",
    description:
      "A study of how rumours spread through heterogeneous cellular automata, connecting mathematical modelling with social and computational systems.",
    technologies: [
      "Mathematical modelling",
      "Cellular automata",
      "Simulation",
      "Complex systems",
    ],
    cover: "/projects/rumour-simulation.webp",
    coverAlt:
      "Abstract cellular automata grid showing an uneven propagation wave",
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
    items: ["Git", "GitHub Actions", "Docker", "VS Code", "Postman"],
  },
];

export const education: Education[] = [
  {
    degree: "Master of Information Technology",
    institution: "University of Auckland",
    period: "2026 — Present",
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
