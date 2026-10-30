import type { Project } from "../data/profile";
import "./project-cover.css";

const compositions: Record<string, { name: string; line: string }> = {
  folio: { name: "Folio", line: "Keep the evidence close." },
  explainlab: { name: "ExplainLab", line: "Systems, made visible." },
  "nz-electricity-forecasting": { name: "NZ Electricity", line: "Demand, with context." },
};

export function ProjectCover({ project, index }: { project: Project; index: number }) {
  const composition = compositions[project.slug];
  if (!composition) return <img src={project.cover} alt={project.coverAlt} width={project.coverWidth ?? 1280} height={project.coverHeight ?? 720} loading={index < 3 ? "eager" : "lazy"} decoding="async" style={{ objectPosition: project.coverPosition ?? "center" }} />;
  return <span className={`project-cover project-cover--${project.slug}`} aria-hidden="true">
    <span className="project-cover__identity"><span className="project-cover__name">{composition.name}</span><span className="project-cover__line">{composition.line}</span></span>
    <span className="project-cover__frame"><img src={project.cover} alt={project.coverAlt} width={project.coverWidth ?? 1280} height={project.coverHeight ?? 720} loading={index < 3 ? "eager" : "lazy"} decoding="async" /></span>
  </span>;
}
