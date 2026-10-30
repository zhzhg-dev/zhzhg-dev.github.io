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
  shortDescription?: string;
  cardSummary?: string;
  caseStudy?: {
    problem: string;
    contribution: string;
    decisions: { title: string; body: string }[];
    evidence: { title: string; body: string }[];
    next: string;
  };
  decisionTitle?: string;
  decision?: string;
  technologies: string[];
  cover: string;
  coverAlt: string;
  coverWidth?: number;
  coverHeight?: number;
  coverPosition?: "top" | "center";
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
    "I turn ideas into practical AI-enabled products—connecting user needs, working prototypes, and evidence from evaluation.",
  location: "Auckland, New Zealand",
  availability: "Building AI products · Exploring game AI",
  github: "https://github.com/zhzhg-dev",
  linkedin: "https://www.linkedin.com/in/grant-zhang-zahz/",
  canonicalUrl: "https://zhzhg-dev.github.io/",
  about: [
    "I’m a Master of Information Technology student and Graduate Teaching Assistant at the University of Auckland, with a foundation in mathematics and computational science. I enjoy turning an unclear problem into a useful product: understand the need, define the requirements, build a prototype, and evaluate what works.",
    "My recent projects include Folio, a research workspace with traceable evidence and optional on-device AI; ExplainLab, an interactive systems simulator; and machine-learning forecasts for New Zealand electricity demand. I’m especially interested in AI product experiences, model evaluation, and how intelligent systems can support games and creative work.",
    "Teaching keeps my work grounded in the person using it. I value clear explanations, testable assumptions, and thoughtful iteration as much as the technology itself.",
  ],
};

export const navigation = [
  { label: "About", href: "/", page: "home" },
  { label: "Projects", href: "/projects/", page: "projects" },
  { label: "Contact", href: "/contact/", page: "contact" },
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
    slug: "folio",
    title: "Folio",
    eyebrow: "AI-enabled research · Product development",
    status: "Working preview",
    description:
      "A research workspace for collecting passages, comparing options, and producing briefs with versioned citations. It combines bilingual passage retrieval, optional on-device AI, and explicit review workflows, with local storage and optional manual cloud backups.",
    shortDescription:
      "Turn source material into research you can revisit, without losing the passages behind a finding.",
    cardSummary: "Research you can trace back to the source.",
    caseStudy: {
      problem:
        "Research gets difficult to trust when a conclusion is separated from its original passage, or when a revised source silently changes what a document appears to support.",
      contribution:
        "My focus is the research workflow: connecting questions, exact source passages, comparisons, and an editable brief, while making review and revision explicit product decisions.",
      decisions: [
        {
          title: "Keep evidence attached to its version",
          body: "A citation retains its original passage, page, and source revision. A newer source can flag connected work for review without overwriting the earlier evidence or authored writing.",
        },
        {
          title: "Make AI optional, and review human",
          body: "The core workspace works without a model. Experimental on-device AI is enabled separately; generated text and suggested evidence do not become verified findings automatically.",
        },
      ],
      evidence: [
        {
          title: "A reviewable path from source to brief",
          body: "The working preview supports source-linked findings, comparison work, explicit brief updates, and document snapshots. Source changes remain visible as review work rather than silently rewriting conclusions.",
        },
        {
          title: "Clear boundaries around storage and access",
          body: "Local work needs no account. Cloud project backups are optional and manual, not real-time collaboration. Public source code does not make the owner-only hosted workspace a public demo.",
        },
      ],
      next:
        "Continue testing larger research workspaces and recovery paths, and evaluate optional AI suggestions without confusing retrieval quality with the truth of a conclusion.",
    },
    decisionTitle: "Review stays a human decision",
    decision:
      "Source updates flag affected findings for review. They don’t silently rewrite a conclusion or mark it as verified.",
    technologies: [
      "React",
      "TypeScript",
      "WebLLM / WebGPU",
      "IndexedDB",
      "Web Workers",
    ],
    cover: "/projects/folio.png",
    coverAlt:
      "Folio comparison workspace with linked sources, evidence review status, and a decision brief action",
    coverWidth: 1440,
    coverHeight: 1000,
    coverPosition: "top",
    sourceUrl: "https://github.com/zhzhg-dev/folio",
    featured: true,
  },
  {
    slug: "explainlab",
    title: "ExplainLab",
    eyebrow: "Interactive systems · Learning experience",
    status: "Live systems lab",
    description:
      "An interactive lab that makes retry storms, cache stampedes, and queue overload visible. A deterministic simulation engine gives two strategies the same seeded workload, so users can change a policy, replay the outcome, and inspect the trade-offs. Reproducible scenario links and bilingual explanations make experiments easy to share and discuss.",
    shortDescription:
      "See when retries prevent recovery, why cache misses pile up, and what happens when a queue accepts too much work.",
    cardSummary: "See why a recovery strategy can make things worse.",
    caseStudy: {
      problem:
        "A retry, a larger queue, or another cache fetch can look helpful in isolation. It is harder to see how those choices interact under pressure—or whether two strategies received a fair comparison.",
      contribution:
        "My focus is connecting the systems model to the learning experience: a deterministic simulation workflow, controls that reveal cause and effect, and explanations that keep the model’s assumptions visible.",
      decisions: [
        {
          title: "Compare policies on the same workload",
          body: "Both strategies receive shared seeded arrivals and service costs. Retry randomness is kept separate, so a policy change does not quietly change the demand used to judge it.",
        },
        {
          title: "Show the requests that did not succeed",
          body: "Failures, rejections, and pending work stay visible beside successful-request latency. A faster-looking average should not hide work that never completed.",
        },
      ],
      evidence: [
        {
          title: "Three experiments you can replay",
          body: "The live lab covers retry storms, cache stampedes, and queue overload. Visitors can change parameters, inspect the timeline, and share a versioned scenario URL with its seed.",
        },
        {
          title: "An explanation, not a production benchmark",
          body: "The model deliberately simplifies real systems: it omits network delays and real distributed coordination, and the cache experiment models one hot key. A useful lesson is not a universal policy recommendation.",
        },
      ],
      next:
        "Use feedback to improve the explanations and model boundaries before adding more experiments. Circuit breakers and other extensions remain ideas, not claims about existing features.",
    },
    decisionTitle: "Both strategies get the same workload",
    decision:
      "Shared arrival times and seeded service costs make policy comparisons reproducible. Failures, rejections, and pending requests stay visible beside successful-request latency.",
    technologies: [
      "TypeScript",
      "React",
      "Discrete-event simulation",
      "Web Workers",
      "Vitest",
    ],
    cover: "/projects/explainlab-landscape.jpg",
    coverAlt:
      "ExplainLab retry-storm experiment comparing fixed retries with exponential backoff and jitter",
    coverWidth: 1265,
    coverHeight: 712,
    coverPosition: "top",
    liveUrl: "https://zhzhg-dev.github.io/explainlab/",
    sourceUrl: "https://github.com/zhzhg-dev/explainlab",
    featured: true,
  },
  {
    slug: "nz-electricity-forecasting",
    title: "NZ Electricity Intelligence",
    eyebrow: "Machine learning · Energy analytics",
    status: "Live ML demo",
    description:
      "An end-to-end forecasting project built on a dataset of 52,608 New Zealand electricity-market periods. It predicts Upper North Island demand across four horizons, estimates wholesale price-spike risk, and presents uncertainty and explanations in a historical-data dashboard. The selected 1-hour model achieved 76.9% lower MAE than the previous-week baseline on the 2025 H2 holdout.",
    shortDescription:
      "Explore electricity-demand forecasts for New Zealand’s Upper North Island, with forecast uncertainty and errors visible beside the result.",
    cardSummary: "Forecast demand—and show where the model struggles.",
    caseStudy: {
      problem:
        "New Zealand electricity demand follows daily and weekly rhythms, but weather and changing consumption make those patterns imperfect. Rare price spikes also make a reassuring headline score easy to misread.",
      contribution:
        "My focus is the end-to-end pipeline: validating market and weather inputs, engineering time-aware features, comparing models with simple baselines, and making errors and uncertainty inspectable in a dashboard.",
      decisions: [
        {
          title: "Keep future information out of model selection",
          body: "Features use information available at the prediction origin. Expanding time blocks support model selection; July–December 2025 is reserved as an untouched final holdout—later, unseen data for evaluation—rather than being mixed into a random split.",
        },
        {
          title: "Treat uncertainty and rare events honestly",
          body: "The dashboard presents empirical intervals and forecast errors alongside predictions. Price-spike evaluation keeps precision, recall, prevalence, and false alarms visible instead of relying on ROC-AUC alone.",
        },
      ],
      evidence: [
        {
          title: "A measurable historical comparison",
          body: "On the 2025 H2 holdout, the selected 1-hour demand model recorded 17.2 MW MAE (mean absolute error): 76.9% lower than the previous-week baseline. That result describes a particular horizon, baseline, region, and time period—not future operational accuracy.",
        },
        {
          title: "The difficult cases stay visible",
          body: "The repository includes error-slice analysis and a reproducible data pipeline. High-demand periods are a documented weakness, while rare-event prevalence changes limit how price-spike scores transfer across market regimes.",
        },
      ],
      next:
        "Evaluate archived weather forecasts and rolling-origin retraining before considering operational use. The live application remains a historical demonstration, not a live forecast or market-advice product.",
    },
    decisionTitle: "Evaluate on later, unseen data",
    decision:
      "The 1-hour model recorded 17.2 MW MAE on the untouched July–December 2025 holdout. Models were selected using earlier time blocks, not a random split.",
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
    coverWidth: 1280,
    coverHeight: 720,
    liveUrl: "https://nz-electricity-forecasting.streamlit.app/",
    sourceUrl: "https://github.com/zhzhg-dev/nz-electricity-forecasting",
    featured: true,
  },
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
    coverWidth: 1280,
    coverHeight: 720,
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
    coverWidth: 1280,
    coverHeight: 720,
    liveUrl: "https://zhzhg-dev.github.io/course-review-system/",
    sourceUrl: "https://github.com/zhzhg-dev/course-review-system",
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
    coverWidth: 1280,
    coverHeight: 720,
    liveUrl: "https://zhzhg-dev.github.io/svelte-study-planner/",
    sourceUrl: "https://github.com/zhzhg-dev/svelte-study-planner",
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
    coverWidth: 1280,
    coverHeight: 720,
  },
];

export const projectStats = {
  total: projects.length,
  live: projects.filter((project) => project.liveUrl).length,
  source: projects.filter((project) => project.sourceUrl).length,
};

export const skills = [
  {
    category: "Product & evaluation",
    items: [
      "Requirements analysis",
      "Prototyping",
      "Research workflows",
      "Model evaluation",
      "Evidence review",
      "Technical communication",
    ],
  },
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
      "On-device AI",
      "Retrieval evaluation",
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
